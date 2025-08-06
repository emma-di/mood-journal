document.addEventListener('DOMContentLoaded', () => {
  const petals = document.querySelectorAll('.collapsible');
  petals.forEach(petal => {
    petal.addEventListener('click', () => {
      petal.classList.toggle('expanded');
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.entry-form');
  let isDragging = false;
  let offsetX, offsetY;

  form.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - form.getBoundingClientRect().left;
    offsetY = e.clientY - form.getBoundingClientRect().top;
    form.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    form.style.left = `${x}px`;
    form.style.top = `${y}px`;
    form.style.transform = 'none'; // disable centering transform
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    form.style.cursor = 'grab';
  });
});
