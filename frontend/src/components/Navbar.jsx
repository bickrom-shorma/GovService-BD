
function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4">
      <div className="container-fluid">

        <a className="navbar-brand fw-bold text-primary" href="/">
          GovService BD
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">

            <li className="nav-item">
              <a className="nav-link active" href="/">Home</a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/services">Services</a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/my-documents">My Documents</a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/login">Login</a>
            </li>

            <li className="nav-item">
              <select className="form-select form-select-sm">
                <option>English</option>
                <option>বাংলা</option>
              </select>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
