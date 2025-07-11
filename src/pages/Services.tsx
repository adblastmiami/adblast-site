import './Services.css';

const services = [
  {
    name: 'Basic EDDM Postcards',
    desc: 'Standard 6.5x9" postcards, full color, thin stock. Print only, min. 5,000. Perfect for budget mass mailings. (You design, we print & ship to you or USPS)',
    price: '$0.11 per card (min. 5,000)',
    img: 'https://cdn.mycreativeshop.com/images/templates/22396/mycreativeshop-plumbing-eddm-postcard-template2ckipejt5z-37998-trans-thumb.png',
  },
  {
    name: 'Premium EDDM Postcards',
    desc: 'Full-service design, print, and delivery to every door in your target Miami neighborhood. High-gloss, vibrant, and effective.',
    price: '$0.68 per card (min. 500, includes design & delivery)',
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', // Unsplash
  },
  {
    name: 'Business Cards',
    desc: 'Premium, Miami-styled business cards with custom design. Stand out at every networking event.',
    price: '$79 for 500 cards',
    img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80', // Unsplash
  },
  {
    name: 'Flyers & Brochures',
    desc: 'Glossy, full-color flyers and tri-fold brochures. Perfect for events, menus, and promotions.',
    price: '$189 for 1,000 flyers',
    img: 'https://images.unsplash.com/photo-1515168833906-d2a3b82b302c?auto=format&fit=crop&w=600&q=80', // Unsplash
  },
  {
    name: 'Grand Opening Kits',
    desc: 'Everything you need for a Miami launch: EDDM postcards, banners, and business cards in one package.',
    price: '$499 per kit',
    img: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', // Unsplash
  },
];

// Note: For $0.07–$0.09 EDDM printing, use trade printers like 4over.com, Zoo Printing, or GotPrint Wholesale.

const Services = () => (
  <section className="services-section">
    <h1 className="services-title">Our Services</h1>
    <div className="services-grid">
      {services.map((service) => (
        <div className="service-card" key={service.name}>
          <img className="service-img" src={service.img} alt={service.name} />
          <div className="service-name">{service.name}</div>
          <div className="service-desc">{service.desc}</div>
          <div className="service-price">{service.price}</div>
        </div>
      ))}
    </div>
  </section>
);

export default Services;
