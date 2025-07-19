import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#E12025] text-white z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-12">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Pokédex</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
