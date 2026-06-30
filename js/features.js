document.addEventListener('DOMContentLoaded', () => {
  // Sticky Scroll Features Intersection Observer
  const topicBlocks = document.querySelectorAll('.topic-block');
  const dynamicVisual = document.getElementById('dynamic-visual');

  const visualHTML = [
    // Visual 1: Nodes / Automation
    `<img src="../assets/images/feature_automation.png" alt="Automation UI" style="width:100%; height:100%; object-fit:cover; border-radius: 1.5rem;" />`,
     
    // Visual 2: Collaboration
    `<img src="../assets/images/feature_collaboration.png" alt="Collaboration UI" style="width:100%; height:100%; object-fit:cover; border-radius: 1.5rem;" />`,
     
    // Visual 3: Analytics
    `<img src="../assets/images/feature_analytics.png" alt="Analytics UI" style="width:100%; height:100%; object-fit:cover; border-radius: 1.5rem;" />`,
     
    // Visual 4: Integrations
    `<img src="../assets/images/feature_integrations.png" alt="Integrations UI" style="width:100%; height:100%; object-fit:cover; border-radius: 1.5rem;" />`
  ];

  if (topicBlocks.length > 0 && dynamicVisual) {
    // Initial load
    dynamicVisual.innerHTML = visualHTML[0];
    
    // Fallback simple activation if IntersectionObserver not supported (or just for mobile)
    const isMobile = window.innerWidth <= 992;
    
    const topicObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Trigger if it's intersecting the center 60% of the screen
        if (entry.isIntersecting) {
          if (!isMobile) {
            topicBlocks.forEach(b => b.classList.remove('active'));
            entry.target.classList.add('active');
          }
          
          const idx = parseInt(entry.target.getAttribute('data-index'));
          
          dynamicVisual.style.opacity = '0';
          dynamicVisual.style.transform = 'scale(0.95)';
          
          setTimeout(() => {
            dynamicVisual.innerHTML = visualHTML[idx];
            dynamicVisual.style.opacity = '1';
            dynamicVisual.style.transform = 'scale(1)';
          }, 400);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: isMobile ? "0px 0px 0px 0px" : "-20% 0px -20% 0px"
    });

    topicBlocks.forEach(block => topicObserver.observe(block));
  }
});
