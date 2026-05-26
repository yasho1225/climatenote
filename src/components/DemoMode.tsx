import React, { useState } from 'react';
import { NotebookPen, BookOpen, Archive, Info, Calendar, Clock, StickyNote, Users, Heart, Flame } from 'lucide-react';
import { sanitizeArticleHtml } from '../lib/htmlSanitizer';

export default function DemoMode() {
  const [currentView, setCurrentView] = useState<'article' | 'notebook' | 'archive' | 'about'>('article');

  const demoArticle = {
    title: "The Hidden Carbon Cost of Digital Life",
    subtitle: "Every email, video stream, and cloud backup contributes to climate change. Here's how to reduce your digital footprint without sacrificing connectivity.",
    content: `<p>In our increasingly connected world, we often forget that our digital activities have a very real environmental impact. Every Google search, Netflix binge, and cloud backup contributes to global carbon emissions through the massive data centers that power our online lives.</p>

<h2>The Scale of Digital Emissions</h2>
<p>The information and communication technology (ICT) sector now accounts for approximately 4% of global greenhouse gas emissions—roughly equivalent to the aviation industry. By 2040, this could rise to 14% if current trends continue.</p>

<p>Consider these eye-opening statistics:</p>
<ul>
<li>A single email generates about 4g of CO2</li>
<li>An email with attachments can produce up to 50g of CO2</li>
<li>Streaming one hour of video generates about 36g of CO2</li>
<li>The average smartphone user generates 85kg of CO2 annually from data usage alone</li>
</ul>

<h2>Simple Ways to Reduce Your Digital Footprint</h2>

<h3>Email Management</h3>
<ul>
<li>Unsubscribe from newsletters you don't read</li>
<li>Delete old emails regularly, especially those with large attachments</li>
<li>Use "Reply" instead of "Reply All" when possible</li>
<li>Compress files before sending attachments</li>
</ul>

<h3>Streaming Smarter</h3>
<ul>
<li>Download content for offline viewing instead of re-streaming</li>
<li>Reduce video quality when high definition isn't necessary</li>
<li>Use audio-only modes for background content</li>
<li>Close streaming apps completely when not in use</li>
</ul>

<p>The goal isn't to disconnect from our digital world, but to be more mindful about how we engage with it. Small changes in our daily digital habits can add up to significant environmental impact when multiplied across billions of users worldwide.</p>`,
    category: "Technology & Environment",
    published_date: new Date().toISOString().split('T')[0],
    reading_time: 8,
    key_takeaways: [
      'The ICT sector accounts for 4% of global emissions, equivalent to aviation',
      'A single email generates 4g of CO2, while emails with attachments can produce 50g',
      'Streaming one hour of video generates about 36g of CO2',
      'Regular email cleanup and unsubscribing reduces server storage needs',
      'Downloading content for offline viewing is more efficient than re-streaming'
    ]
  };

  const demoNotes = [
    {
      id: '1',
      content: "I'm going to start unsubscribing from newsletters I don't actually read. Just realized I have dozens of them cluttering my inbox!",
      user: "EcoWarrior23",
      date: "2025-01-15",
      reactions: 12
    },
    {
      id: '2', 
      content: "Switching to audio-only mode for YouTube videos I'm just listening to while working. Never thought about the carbon impact of unnecessary video streaming.",
      user: "GreenTechie",
      date: "2025-01-15",
      reactions: 8
    },
    {
      id: '3',
      content: "Downloaded my favorite shows for offline viewing instead of re-streaming them. Plus it saves data when I'm traveling!",
      user: "SustainableSarah",
      date: "2025-01-14",
      reactions: 15
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-emerald-600 text-white py-2 px-6 text-center">
        <p className="text-sm">
          🌱 <strong>Demo Mode</strong> - This is a preview of The Climate Note platform. 
          <span className="ml-2">Connect your database to enable full functionality.</span>
        </p>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <NotebookPen className="w-8 h-8 text-emerald-600" />
            <h1 className="text-xl font-bold text-gray-900">The Climate Note</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <button
              onClick={() => setCurrentView('article')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'article'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <NotebookPen className="w-4 h-4" />
              <span className="font-medium">Today</span>
            </button>
            
            <button
              onClick={() => setCurrentView('notebook')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'notebook'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Notebook</span>
            </button>
            
            <button
              onClick={() => setCurrentView('archive')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'archive'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="font-medium">Archive</span>
            </button>
            
            <button
              onClick={() => setCurrentView('about')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'about'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="font-medium">About</span>
            </button>
          </nav>

          {/* Demo Streak */}
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-orange-700">7</span>
            <span className="text-sm text-orange-600">day streak</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8">
        {currentView === 'article' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{demoArticle.reading_time} min read</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                  {demoArticle.category}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                {demoArticle.title}
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                {demoArticle.subtitle}
              </p>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div 
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(demoArticle.content) }}
                className="text-gray-800 leading-relaxed"
              />
            </div>

            {/* Key Takeaways */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center space-x-2 mb-3">
                <StickyNote className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Key Takeaways</h3>
              </div>
              <ul className="space-y-2">
                {demoArticle.key_takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start space-x-2 text-yellow-900">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Demo Action Note Section */}
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">What will you do differently?</h3>
                <p className="text-gray-600">
                  After reading this article, what's one specific action you can take in your daily life 
                  to make a positive environmental impact?
                </p>
                <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-lg">
                  <p className="text-sm">📝 Connect your database to write and save action notes!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'notebook' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Notebook</h1>
              <p className="text-gray-600 mb-6">
                See how others are turning climate awareness into daily action
              </p>
            </div>

            <div className="grid gap-6">
              {demoNotes.map((note) => (
                <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {note.user.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{note.user}</p>
                        <p className="text-sm text-gray-500">{note.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Heart className="w-4 h-4" />
                      <span>{note.reactions}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'archive' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Archive</h1>
              <p className="text-gray-600">
                Explore our collection of environmental insights and action guides
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full mb-3">
                  Technology & Environment
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  The Hidden Carbon Cost of Digital Life
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Every email, video stream, and cloud backup contributes to climate change...
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Today</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>8 min</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mb-3">
                  Sustainable Living
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Growing Food in Concrete Jungles
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  How cities worldwide are transforming rooftops into productive farms...
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Yesterday</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>7 min</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full mb-3">
                  Fast Fashion
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  The Hidden Cost of Returns
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Every year, billions of returned clothes end up in landfills...
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>2 days ago</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>6 min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <NotebookPen className="w-12 h-12 text-emerald-600" />
                <h1 className="text-4xl font-bold text-gray-900">About The Climate Note</h1>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Turning environmental awareness into daily action, one note at a time
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                The Climate Note is different from other newsletters in a way we encourage you to take actions 
                for the environment. Through our articles, and the 'climate note' function, we will help you 
                think more about your actions and remind you of a small habit to fix.
              </p>
              <p className="text-center text-xl font-semibold text-emerald-600">
                Together, I am confident that climate change is solvable.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-emerald-50 rounded-lg">
                <NotebookPen className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Daily Insights</h3>
                <p className="text-gray-600 text-sm">
                  Fresh environmental stories and actionable insights delivered every day
                </p>
              </div>
              
              <div className="text-center p-6 bg-emerald-50 rounded-lg">
                <Heart className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Action-Focused</h3>
                <p className="text-gray-600 text-sm">
                  Turn reading into action with personal climate notes and habit tracking
                </p>
              </div>
              
              <div className="text-center p-6 bg-emerald-50 rounded-lg">
                <Users className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Community Impact</h3>
                <p className="text-gray-600 text-sm">
                  Join a community of young environmental champions making a difference
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}