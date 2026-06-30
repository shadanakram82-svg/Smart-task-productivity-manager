document.addEventListener('DOMContentLoaded', () => {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  if (scrollToTopBtn) {
    // Check if there is a specific scroll container (like .main-content in dashboard)
    const scrollContainer = document.querySelector('.main-content') || window;

    scrollContainer.addEventListener('scroll', () => {
      // Use scrollY for window, scrollTop for elements
      const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      
      if (currentScroll > 300) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
      }
    });

    scrollToTopBtn.addEventListener('click', () => {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
