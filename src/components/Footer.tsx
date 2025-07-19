const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mt-2 md:mt-0 mb-2 md:mb-0">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Maciej Skorus
            </p>
          </div>

          <div className="flex space-x-8">
            <a
              href="https://github.com/SkorczanFFF/pokedex"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FECB09]"
            >
              GitHub
            </a>
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FECB09]"
            >
              PokéAPI
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
