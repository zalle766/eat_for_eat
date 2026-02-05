export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: '"Pacifico", serif' }}>
              Eat to Eat
            </h3>
            <p className="text-gray-300 mb-4 max-w-md">
              La plateforme de livraison de nourriture leader qui vous connecte aux meilleurs restaurants de votre région. 
              Nous offrons un service de livraison rapide et fiable pour des repas délicieux.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                <i className="ri-facebook-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                <i className="ri-twitter-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                <i className="ri-instagram-fill text-xl"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                <i className="ri-linkedin-fill text-xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="/restaurant-signup" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                  Rejoindre comme restaurant
                </a>
              </li>
              <li>
                <a href="/driver-signup" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                  Rejoindre comme livreur
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-500 cursor-pointer">
                  Aide et support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contactez-nous</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <i className="ri-phone-line text-orange-500"></i>
                <span className="text-gray-300">+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-mail-line text-orange-500"></i>
                <span className="text-gray-300">info@eat-to-eat.fr</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-map-pin-line text-orange-500"></i>
                <span className="text-gray-300">Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © 2024 Eat to Eat. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-300 hover:text-orange-500 text-sm cursor-pointer">
              Politique de confidentialité
            </a>
            <a href="#" className="text-gray-300 hover:text-orange-500 text-sm cursor-pointer">
              Conditions d'utilisation
            </a>
            <a href="https://readdy.ai/?origin=logo" className="text-gray-300 hover:text-orange-500 text-sm cursor-pointer">
              Powered by Readdy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
