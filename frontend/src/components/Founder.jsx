import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

export default function Founder() {
  const { isDarkMode } = useTheme();

  return (
    <section
      id="founder"
      className={`section-padding ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-w-4 aspect-h-5">
              <img
                src="/img/testimonials/patrick.png"
                alt="Fondateur de SOLIFIN"
                className="object-cover rounded-2xl shadow-2xl"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className={`absolute -bottom-6 -right-6 ${
                isDarkMode ? "bg-primary-500" : "bg-primary-600"
              } text-white p-6 rounded-xl shadow-xl`}
            >
              <p className="text-2xl font-bold">10+ ans</p>
              <p className="text-sm">d'expertise</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2
              className={`heading-secondary mb-6 ${
                isDarkMode ? "text-white" : ""
              }`}
            >
              Rencontrez Notre{" "}
              <span
                className={isDarkMode ? "text-primary-400" : "text-primary-600"}
              >
                Fondateur
              </span>
            </h2>

            <div
              className={`space-y-6 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <p className="text-lg">
                Passionné par l'économie solidaire et l'inclusion financière,
                Patrick Mukengere a fondé SOLIFIN en 2020 avec une vision claire
                : démocratiser l'accès aux opportunités financières pour tous.
              </p>

              <p>
                Diplômé en ... à l'Institut Supérieur de Développement Rural
                (ISDR) et titulaire d'un ..., Patrick a travaillé pendant plus
                de 10 ans dans le secteur ... avant de se consacrer à son projet
                entrepreneurial. Son expérience dans les marchés émergents lui a
                permis d'identifier les obstacles que rencontrent de nombreuses
                personnes pour accéder aux services financiers traditionnels.
              </p>

              <p>
                Aujourd'hui, sous sa direction, SOLIFIN est devenu un acteur
                incontournable de l'écosystème fintech en Afrique francophone,
                avec une communauté en croissance constante et des membres dans
                plus de 1+ pays.
              </p>

              <blockquote
                className={`border-l-4 ${
                  isDarkMode ? "border-primary-400" : "border-primary-500"
                } pl-4 italic`}
              >
                "Notre mission va au-delà de la simple création de richesse.
                Nous construisons un écosystème financier inclusif où chacun
                peut prospérer, apprendre et contribuer à une économie plus
                équitable."
              </blockquote>

              <div className="pt-4">
                <h3
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Patrick Mukengere
                </h3>
                <p
                  className={
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }
                >
                  Fondateur & CEO de SOLIFIN
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 pt-4"
              >
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className={`${
                    isDarkMode
                      ? "text-primary-400 hover:text-primary-300"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  href="#"
                  className={`${
                    isDarkMode
                      ? "text-primary-400 hover:text-primary-300"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
