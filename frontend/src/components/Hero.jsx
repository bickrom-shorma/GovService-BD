
import './Hero.css';

function Hero() {
  return (
    <section className="hero-section">
      <div className="container text-center">

        <h1>Get Government Services Online</h1>

        <p className="hero-description">
          Find government services, required documents,
          fees and application guidelines in one place.
        </p>

        <div className="search-box">
          <input
            type="text"
            className="form-control"
            placeholder="Search government services..."
          />

          <button className="btn btn-primary">
            Search
          </button>
        </div>

        <div className="popular-services">
          <p>Popular Services:</p>

          <span>NID Services</span>
          <span>Birth Registration</span>
          <span>Passport</span>
        </div>

      </div>
    </section>
  );
}

export default Hero;
