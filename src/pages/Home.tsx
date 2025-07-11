import './Home.css';
import AnimatedHomeLogo from './AnimatedHomeLogo';

const Home = () => (
  <div className="home-hero minimal">
    <AnimatedHomeLogo />
    <p className="subtitle minimal">EDDM & Direct Mail, Done Right</p>
    <p className="hero-desc minimal">
      Professional, effective print marketing for Miami businesses. Simple. Reliable. Local.
    </p>
    <div className="hero-actions minimal">
      <a href="/services" className="hero-btn minimal">View Services</a>
    </div>
  </div>
);

export default Home;
