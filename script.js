// ============ MOBILE MENU ============
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });

  // Close menu when clicking a link
  document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      const icon = menuToggle.querySelector('i');
      icon.classList.add('fa-bars');
      icon.classList.remove('fa-times');
    });
  });
}

// ============ HEADER SCROLL EFFECT ============
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ============ SERVICE FILTER ============
const filterBtns = document.querySelectorAll('.filter-btn');
const serviceCards = document.querySelectorAll('.service-card-full');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    serviceCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
        card.style.animation = 'fadeIn 0.4s ease';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

// ============ FORM HANDLING ============
function handleFormSubmit(formId, successMessage) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Simulate submission (replace with real backend/Formspree/EmailJS)
    setTimeout(() => {
      alert(successMessage + '\n\nWe will contact you within 24 hours.\n\nThank you for choosing ARJU ONLINE SERVICES!');
      form.reset();
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;

      // Optional: Open WhatsApp with pre-filled message
      const phone = data.phone || '';
      const name = data.name || '';
      const service = data.service || '';
      const msg = `Hello ARJU ONLINE SERVICES,%0A%0AMy name is ${name}.%0APhone: ${phone}%0AService: ${service}%0A%0AI would like to apply for the above service.`;
      
      const openWA = confirm('Would you like to also send this via WhatsApp for faster response?');
      if (openWA) {
        window.open(`https://wa.me/91XXXXXXXXXX?text=${msg}`, '_blank');
      }
    }, 1500);
  });
}

handleFormSubmit('contactForm', '✅ Message Sent Successfully!');
handleFormSubmit('applyForm', '✅ Application Submitted Successfully!');

// ============ SCROLL ANIMATIONS ============
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.service-card, .feature, .value-card, .testimonial, .info-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ============ COUNTER ANIMATION ============
function animateCounter(el, target) {
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current) + (el.dataset.suffix || '');
  }, 16);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      const text = entry.target.textContent;
      const num = parseInt(text);
      const suffix = text.replace(/[0-9]/g, '');
      entry.target.dataset.suffix = suffix;
      animateCounter(entry.target, num);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat h3').forEach(el => statObserver.observe(el));

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============ CURRENT YEAR ============
document.querySelectorAll('.footer-bottom p').forEach(p => {
  if (p.innerHTML.includes('2026')) {
    // Already set correctly
  }
});

console.log('%c🎉 ARJU ONLINE SERVICES', 'color: #1e40af; font-size: 20px; font-weight: bold;');
console.log('%cGovernment Verified CSC | Airtel Payments Bank Head', 'color: #f97316; font-size: 14px;');
