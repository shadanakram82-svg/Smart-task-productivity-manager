document.addEventListener('DOMContentLoaded', () => {
  
  // ── JOURNEY TIMELINE ANIMATION ──
  const timeline = document.querySelector('.timeline');
  const progressBar = document.querySelector('.timeline-progress');
  const nodes = document.querySelectorAll('.timeline-node');

  function updateTimeline() {
    if (!timeline || !progressBar) return;

    // Get the top and bottom of the timeline relative to the viewport
    const rect = timeline.getBoundingClientRect();
    const timelineTop = rect.top;
    const timelineHeight = rect.height;
    
    // We want the progress to start when the top of the timeline reaches the middle of the screen
    // and finish when the bottom of the timeline reaches the middle of the screen.
    const triggerPoint = window.innerHeight * 0.6; // 60% down the screen
    
    let progress = 0;
    
    if (timelineTop < triggerPoint) {
      // Calculate how far we've scrolled past the trigger point
      const distancePastTrigger = triggerPoint - timelineTop;
      progress = (distancePastTrigger / timelineHeight) * 100;
      
      // Clamp between 0 and 100
      progress = Math.max(0, Math.min(100, progress));
    }
    
    progressBar.style.height = `${progress}%`;

    // Light up nodes as the progress bar reaches them
    nodes.forEach(node => {
      // Get the node's position relative to the timeline top
      // Node is position: absolute; top: X;
      // But they are positioned via margins or relative to timeline-items in our CSS.
      // Actually, nodes are inside timeline-items which have top offsets.
      
      const nodeRect = node.getBoundingClientRect();
      // If the node's center is above the bottom of the progress bar (which is at triggerPoint - distance + progressHeight... easier to just check if node is above the trigger line)
      if (nodeRect.top + (nodeRect.height/2) < triggerPoint) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  }

  // Initial check and scroll listener
  updateTimeline();
  window.addEventListener('scroll', () => {
    // Throttle slightly using requestAnimationFrame
    window.requestAnimationFrame(updateTimeline);
  });
});
