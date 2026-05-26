// classify-note-impact Edge Function
// Uses OpenAI to extract action details from user notes,
// then applies research-backed formulas to calculate environmental impact.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { writeAuditLog } from '../_shared/auditLog.ts'
import { requireAuthenticatedUser, createServiceClient } from '../_shared/auth.ts'
import { isValidNoteContent, isValidUuid } from '../_shared/requestGuards.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkRateLimit, rateLimitKeyFromAuth } from '../_shared/rateLimit.ts'
import { areAiEndpointsEnabled } from '../_shared/securityFlags.ts'
import { getClientIp, logSecurityEvent } from '../_shared/securityLog.ts'

const ENDPOINT = 'classify-note-impact'

// ─── RESEARCH-BACKED IMPACT FORMULAS ──────────────────────────────────────────
// Sources: EPA 2024, IPCC 2023, Poore & Nemecek 2018, IEA 2024, Water Footprint Network
const IMPACT_FORMULAS: Record<string, any> = {
  // Transportation
  car_to_bike_per_mile:        { co2_kg: 0.404,  source: 'EPA 2024' },
  car_to_walk_per_mile:        { co2_kg: 0.404,  source: 'EPA 2024' },
  car_to_transit_per_mile:     { co2_kg: 0.228,  source: 'EPA 2024' },
  car_to_carpool_per_mile:     { co2_kg: 0.202,  source: 'EPA 2024' },
  flight_avoided_per_mile:     { co2_kg: 0.255,  source: 'ICAO 2023' },
  car_trip_avoided_default:    { co2_kg: 1.2,    source: 'EPA avg 3mi trip' },

  // Food
  beef_meal_to_veg:            { co2_kg: 3.5,    source: 'Poore & Nemecek 2018' },
  meat_meal_to_veg:            { co2_kg: 2.5,    source: 'Oxford 2023' },
  dairy_meal_skipped:          { co2_kg: 0.9,    source: 'Poore & Nemecek 2018' },
  food_waste_prevented_kg:     { co2_kg: 2.5,    source: 'FAO 2023' },

  // Waste
  plastic_bottle_avoided:      { co2_kg: 0.082,  plastic_g: 25,   source: 'Plastic Pollution Coalition' },
  plastic_bag_avoided:         { co2_kg: 0.033,  plastic_g: 10,   source: 'EPA' },
  straw_avoided:               { co2_kg: 0.003,  plastic_g: 0.5,  source: 'EPA' },
  recycling_kg:                { co2_kg: 0.5,    source: 'EPA WasteWise' },
  composting_kg:               { co2_kg: 0.3,    source: 'EPA' },

  // Energy
  led_bulb_switch:             { co2_kg: 0.15,   energy_kwh: 0.5,  source: 'DOE 2024' },
  lights_off_per_hour:         { co2_kg: 0.046,  energy_kwh: 0.06, source: 'IEA avg' },
  unplug_device_per_day:       { co2_kg: 0.03,   energy_kwh: 0.1,  source: 'DOE' },
  thermostat_1deg_per_day:     { co2_kg: 0.3,    energy_kwh: 1.0,  source: 'DOE' },
  solar_kwh:                   { co2_kg: 0.92,   energy_kwh: 1.0,  source: 'IEA 2024' },

  // Water
  shower_minute_saved:         { water_liters: 9,   co2_kg: 0.0027, source: 'EPA WaterSense' },
  tap_off_brushing:            { water_liters: 8,   co2_kg: 0.0024, source: 'EPA WaterSense' },
  shorter_shower_5min:         { water_liters: 45,  co2_kg: 0.0135, source: 'EPA WaterSense' },
  rainwater_collected_liter:   { water_liters: 1,   source: 'WFN' },

  // Shopping
  fast_fashion_item_avoided:   { co2_kg: 10.0,  water_liters: 2700, source: 'UNEP 2023' },
  secondhand_item_bought:      { co2_kg: 5.0,   source: 'ThredUp 2023' },
  local_produce_meal:          { co2_kg: 0.5,   source: 'Worldwatch Institute' },
}

// ─── DEFAULT VALUES (used when AI gives no specific quantity) ─────────────────
const CATEGORY_DEFAULTS: Record<string, any> = {
  transportation: { formula_id: 'car_trip_avoided_default', co2_kg: 1.2 },
  food:           { formula_id: 'meat_meal_to_veg',         co2_kg: 2.5 },
  waste:          { formula_id: 'plastic_bottle_avoided',   co2_kg: 0.082, plastic_g: 25 },
  energy:         { formula_id: 'lights_off_per_hour',      co2_kg: 0.046 },
  water:          { formula_id: 'tap_off_brushing',         water_liters: 8, co2_kg: 0.0024 },
  shopping:       { formula_id: 'fast_fashion_item_avoided',co2_kg: 10.0 },
  other:          { co2_kg: null },
}

// ─── STEP 1: AI EXTRACTS ACTION DETAILS ──────────────────────────────────────
async function classifyWithAI(noteContent: string, geminiKey: string) {
  const prompt = `You are an environmental impact classifier. Analyze a user's climate action note and extract structured data.

CATEGORIES: transportation, food, waste, energy, water, shopping, other

ACTION TYPES per category:
- transportation: car_to_bike, car_to_walk, car_to_transit, car_to_carpool, flight_avoided, car_trip_avoided
- food: beef_to_veg, meat_to_veg, dairy_skipped, food_waste_prevented, local_produce
- waste: plastic_bottle_avoided, plastic_bag_avoided, straw_avoided, recycling, composting
- energy: led_switch, lights_off, unplug_device, thermostat_adjust, solar
- water: shorter_shower, tap_off_brushing, rainwater_collect
- shopping: fast_fashion_avoided, secondhand_bought
- other: general_action

Respond ONLY with valid JSON like:
{
  "category": "transportation",
  "action_type": "car_to_bike",
  "quantity": 5,
  "unit": "miles",
  "confidence": 0.92,
  "reasoning": "User clearly states biking 5 miles instead of driving"
}

Rules:
- confidence: 0.0-1.0 (be conservative, only 0.9+ if very explicit)
- quantity: numeric value extracted from note, null if not mentioned
- unit: miles, km, kg, liters, hours, items, meals, minutes — null if not applicable
- If vague or unclear, set confidence below 0.7

Classify this climate action note: "${noteContent}"`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      }),
    }
  )

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)

  const data = await response.json()
  const raw = data.candidates[0]?.content?.parts[0]?.text?.trim()
  if (!raw) throw new Error('Empty response from Gemini')

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  // Parse and validate JSON
  const parsed = JSON.parse(cleaned)
  if (!parsed.category || !parsed.confidence) throw new Error('Invalid AI response format')

  return parsed
}

// ─── STEP 2: APPLY RESEARCH-BACKED FORMULA ────────────────────────────────────
function calculateImpact(aiResult: any) {
  const { category, action_type, quantity, unit, confidence } = aiResult

  // Build formula key based on action type
  let formulaKey = null
  let multiplier = 1

  if (action_type === 'car_to_bike' || action_type === 'car_to_walk') {
    formulaKey = action_type === 'car_to_bike' ? 'car_to_bike_per_mile' : 'car_to_walk_per_mile'
    if (quantity && (unit === 'miles' || unit === 'km')) {
      multiplier = unit === 'km' ? quantity * 0.621 : quantity
    }
  } else if (action_type === 'car_to_transit') {
    formulaKey = 'car_to_transit_per_mile'
    if (quantity && (unit === 'miles' || unit === 'km')) {
      multiplier = unit === 'km' ? quantity * 0.621 : quantity
    }
  } else if (action_type === 'shorter_shower' && quantity && unit === 'minutes') {
    formulaKey = 'shower_minute_saved'
    multiplier = quantity
  } else if (action_type === 'tap_off_brushing') {
    formulaKey = 'tap_off_brushing'
  } else if (action_type === 'beef_to_veg') {
    formulaKey = 'beef_meal_to_veg'
    multiplier = quantity || 1
  } else if (action_type === 'meat_to_veg') {
    formulaKey = 'meat_meal_to_veg'
    multiplier = quantity || 1
  } else if (action_type === 'plastic_bottle_avoided') {
    formulaKey = 'plastic_bottle_avoided'
    multiplier = quantity || 1
  } else if (action_type === 'plastic_bag_avoided') {
    formulaKey = 'plastic_bag_avoided'
    multiplier = quantity || 1
  } else if (action_type === 'straw_avoided') {
    formulaKey = 'straw_avoided'
    multiplier = quantity || 1
  } else if (action_type === 'fast_fashion_avoided') {
    formulaKey = 'fast_fashion_item_avoided'
    multiplier = quantity || 1
  } else if (action_type === 'led_switch') {
    formulaKey = 'led_bulb_switch'
    multiplier = quantity || 1
  } else if (action_type === 'lights_off') {
    formulaKey = 'lights_off_per_hour'
    multiplier = quantity || 1
  }

  // Get formula or fall back to category default
  const formula = formulaKey ? IMPACT_FORMULAS[formulaKey] : null
  const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.other

  if (!formula && !defaults.co2_kg) {
    return { co2_saved_kg: null, plastic_saved_g: null, water_saved_liters: null, energy_saved_kwh: null, formula_id: 'other', formula_source: null }
  }

  const src = formula || defaults
  const fid = formulaKey || defaults.formula_id || 'category_default'

  return {
    co2_saved_kg:       src.co2_kg       ? parseFloat((src.co2_kg       * multiplier).toFixed(4)) : null,
    plastic_saved_g:    src.plastic_g    ? parseFloat((src.plastic_g    * multiplier).toFixed(4)) : null,
    water_saved_liters: src.water_liters ? parseFloat((src.water_liters * multiplier).toFixed(4)) : null,
    energy_saved_kwh:   src.energy_kwh   ? parseFloat((src.energy_kwh  * multiplier).toFixed(4)) : null,
    formula_id:  fid,
    formula_source: src.source || null,
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const ip = getClientIp(req)

  try {
    if (!areAiEndpointsEnabled()) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'ai_disabled', ip })
      return new Response(JSON.stringify({ error: 'AI classification is temporarily unavailable.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const auth = await requireAuthenticatedUser(req)
    if (!auth.ok) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: auth.error, ip })
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { user, userClient } = auth.ctx
    const rateKey = await rateLimitKeyFromAuth(req, 'classify-note-impact')
    const rate = checkRateLimit(rateKey ?? `classify-note-impact:${user.id}`, 15, 60_000)
    if (rate.limited) {
      logSecurityEvent({ endpoint: ENDPOINT, result: 'blocked', reason: 'rate_limit', user_id: user.id, ip })
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { note_id, note_content } = await req.json()
    if (!note_id || !note_content) {
      return new Response(JSON.stringify({ error: 'Missing note_id or note_content' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!isValidUuid(note_id)) {
      return new Response(JSON.stringify({ error: 'Invalid note_id format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!isValidNoteContent(note_content)) {
      return new Response(JSON.stringify({ error: 'Invalid note_content' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not set')

    const { data: ownedNote, error: noteLookupError } = await userClient
      .from('user_notes')
      .select('id, user_id')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (noteLookupError || !ownedNote) {
      return new Response(JSON.stringify({ error: 'Forbidden: note does not belong to caller' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createServiceClient()

    // Step 1: AI classifies the note
    let aiResult
    try {
      aiResult = await classifyWithAI(note_content, geminiKey)
    } catch (err) {
      // If AI fails, store as "other" with no impact
      aiResult = { category: 'other', action_type: 'general_action', quantity: null, unit: null, confidence: 0, reasoning: 'AI classification failed' }
    }

    const needsReview = aiResult.confidence < 0.7

    // Step 2: Calculate impact using research-backed formulas
    const impact = calculateImpact(aiResult)

    // Step 3: Store impact in database
    const { error: insertError } = await supabase.from('note_impacts').upsert({
      note_id,
      user_id: user.id,
      action_category: aiResult.category,
      action_type: aiResult.action_type,
      confidence: aiResult.confidence,
      co2_saved_kg: impact.co2_saved_kg,
      plastic_saved_g: impact.plastic_saved_g,
      water_saved_liters: impact.water_saved_liters,
      energy_saved_kwh: impact.energy_saved_kwh,
      formula_id: impact.formula_id,
      formula_source: impact.formula_source,
      ai_reasoning: aiResult.reasoning,
      needs_review: needsReview,
    }, { onConflict: 'note_id' })

    if (insertError) throw insertError

    // Step 4: If low confidence, add to admin review queue
    if (needsReview) {
      await supabase.from('impact_review_queue').upsert({
        note_id,
        user_id: user.id,
        note_content,
        ai_category: aiResult.category,
        ai_confidence: aiResult.confidence,
        ai_reasoning: aiResult.reasoning,
        status: 'pending',
      }, { onConflict: 'note_id' })
    }

    await writeAuditLog(supabase, {
      user_id: user.id,
      action: 'classify_note_impact',
      ip,
      metadata: { note_id, needs_review: needsReview },
    })

    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'allowed',
      reason: 'classified',
      user_id: user.id,
      ip,
    })

    return new Response(JSON.stringify({
      success: true,
      category: aiResult.category,
      confidence: aiResult.confidence,
      needs_review: needsReview,
      impact,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    logSecurityEvent({
      endpoint: ENDPOINT,
      result: 'blocked',
      reason: 'server_error',
      ip,
    })
    console.error('classify-note-impact error:', error)
    return new Response(JSON.stringify({ success: false, error: 'Classification failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
