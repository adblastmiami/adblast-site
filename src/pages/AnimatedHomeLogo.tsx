import './Home.css';

const AnimatedHomeLogo = () => (
  <div className="home-logo-animated">
    <svg viewBox="0 0 420 90" width="340" height="72" fill="none">
      <defs>
        <linearGradient id="blueWhiteMoveHome" x1="0" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00bcd4">
            <animate attributeName="offset" values="0;1;0" dur="3.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#fff">
            <animate attributeName="offset" values="0.5;0.8;0.5" dur="3.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#00bcd4">
            <animate attributeName="offset" values="1;0;1" dur="3.5s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <text x="30" y="65" fontFamily="Montserrat, Segoe UI, Arial, sans-serif" fontWeight="900" fontSize="56" fill="url(#blueWhiteMoveHome)">
        AdBlast Miami
      </text>
    </svg>
  </div>
);

export default AnimatedHomeLogo;
