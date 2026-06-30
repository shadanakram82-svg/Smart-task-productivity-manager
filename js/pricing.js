document.addEventListener('DOMContentLoaded', () => {
  const billingBtns = document.querySelectorAll('.billing-btn');
  const monthlyPrices = document.querySelectorAll('.price-monthly');
  const yearlyPrices = document.querySelectorAll('.price-yearly');
  const slider = document.querySelector('.toggle-slider');

  function updateSlider() {
    const activeBtn = document.querySelector('.billing-btn.active');
    if (activeBtn && slider) {
      slider.style.width = `${activeBtn.offsetWidth}px`;
      slider.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }
  }

  // Initialize slider position
  setTimeout(updateSlider, 50);
  window.addEventListener('resize', updateSlider);

  // Billing toggle logic
  billingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      billingBtns.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Move slider
      updateSlider();

      const billingType = btn.getAttribute('data-billing');

      if (billingType === 'monthly') {
        monthlyPrices.forEach(p => p.style.display = 'inline-block');
        yearlyPrices.forEach(p => p.style.display = 'none');
      } else {
        monthlyPrices.forEach(p => p.style.display = 'none');
        yearlyPrices.forEach(p => p.style.display = 'inline-block');
      }
    });
  });
});
