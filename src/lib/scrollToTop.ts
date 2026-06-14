/** Scroll window and any in-app scroll containers to the top. */
export function scrollAppToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll('[data-scroll-root]').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTop = 0;
    }
  });
}
