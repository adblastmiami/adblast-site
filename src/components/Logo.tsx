import './Logo.css';

const Logo = () => (
  <div className="adblast-logo">
    <svg viewBox="0 0 140 48" width="120" height="48" fill="none">
      <defs>
        <linearGradient id="blueWhiteMove" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
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
      <text x="10" y="36" fontFamily="Montserrat, Segoe UI, Arial, sans-serif" fontWeight="900" fontSize="32" fill="url(#blueWhiteMove)">
        AdBlast
      </text>
    </svg>
  </div>
);

export default Logo;
