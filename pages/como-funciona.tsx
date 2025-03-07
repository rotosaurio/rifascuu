import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ComoFunciona() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // FAQ items
  const faqItems = [
    {
      question: "¿Cómo puedo participar en una rifa?",
      answer: "Simplemente navega a la sección de rifas activas, selecciona la que te interese, elige tus números y completa el pago. Al finalizar, recibirás un correo electrónico con la confirmación de tus boletos."
    },
    {
      question: "¿Cómo se seleccionan los ganadores?",
      answer: "Los ganadores son seleccionados mediante un proceso aleatorio transparente. Dependiendo de la rifa, puede ser a través de un sistema automatizado, basado en la Lotería Nacional, o mediante una transmisión en vivo en nuestras redes sociales."
    },
    {
      question: "¿Cómo reclamar mi premio si gano?",
      answer: "Si resultas ganador, te notificaremos por correo electrónico y teléfono. Tendrás un plazo de 30 días para reclamar tu premio. El proceso específico dependerá del tipo de premio y se explicará en la notificación."
    },
    {
      question: "¿Puedo organizar mis propias rifas?",
      answer: "¡Claro! Cualquier usuario puede crear rifas. Sin embargo, para garantizar la seguridad de todos, pasamos por un proceso de verificación. Regístrate, configura tu perfil y envía tu solicitud para comenzar a organizar tus propias rifas."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos tarjetas de crédito/débito, transferencias bancarias, y diversos monederos electrónicos. Todos nuestros pagos son procesados de manera segura a través de Stripe, una plataforma líder en procesamiento de pagos."
    }
  ];

  return (
    <>
      <Head>
        <title>Cómo Funciona | RifasCUU</title>
        <meta name="description" content="Aprende cómo funciona nuestra plataforma de rifas en línea, cómo participar y cómo organizar tus propias rifas." />
      </Head>

      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Cómo Funciona RifasCUU</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Nuestra plataforma hace que participar y organizar rifas sea simple, transparente y emocionante.
            </p>
          </div>

          {/* Steps section */}
          <motion.div 
            className="grid md:grid-cols-2 gap-16 mb-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="order-2 md:order-1 flex items-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Para Participantes</h2>
                <ol className="space-y-6">
                  <li className="flex">
                    <span className="flex-shrink-0 bg-yellow-500 text-black h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      1
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Explora las rifas activas</h3>
                      <p className="text-white/80">Navega por nuestra selección de rifas y encuentra premios emocionantes.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-yellow-500 text-black h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      2
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Selecciona tus boletos</h3>
                      <p className="text-white/80">Elige tus números favoritos o permite que el sistema los seleccione al azar.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-yellow-500 text-black h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      3
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Realiza el pago</h3>
                      <p className="text-white/80">Paga de forma segura con tu método preferido.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-yellow-500 text-black h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      4
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">¡Espera el sorteo!</h3>
                      <p className="text-white/80">Sigue la rifa y recibe notificaciones sobre el resultado.</p>
                    </div>
                  </li>
                </ol>
                <div className="mt-8">
                  <Link
                    href="/rifas"
                    className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-3 px-6 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Ver rifas activas
                  </Link>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="order-1 md:order-2 flex items-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Para Organizadores</h2>
                <ol className="space-y-6">
                  <li className="flex">
                    <span className="flex-shrink-0 bg-purple-500 text-white h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      1
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Crea una cuenta</h3>
                      <p className="text-white/80">Regístrate y verifica tu identidad para comenzar a organizar rifas.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-purple-500 text-white h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      2
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Configura tu rifa</h3>
                      <p className="text-white/80">Define el premio, cantidad de boletos, precio y fecha del sorteo.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-purple-500 text-white h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      3
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Promociona tu rifa</h3>
                      <p className="text-white/80">Comparte en redes sociales y aprovecha nuestras herramientas de promoción.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <span className="flex-shrink-0 bg-purple-500 text-white h-8 w-8 rounded-full flex items-center justify-center mr-4 font-bold">
                      4
                    </span>
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Realiza el sorteo y entrega el premio</h3>
                      <p className="text-white/80">Selecciona al ganador de forma transparente y entrega el premio prometido.</p>
                    </div>
                  </li>
                </ol>
                <div className="mt-8">
                  <Link
                    href="/raffles/create"
                    className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Crear una rifa
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Transparency section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Nuestro Compromiso con la Transparencia</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                En RifasCUU creemos que la confianza es fundamental. Por eso nos comprometemos a ser totalmente transparentes en todos los aspectos de nuestras rifas.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                <div className="text-5xl mb-6 text-yellow-300">✓</div>
                <h3 className="text-xl font-bold text-white mb-3">Verificación de Identidad</h3>
                <p className="text-white/80">
                  Verificamos la identidad de todos los organizadores para garantizar que sean personas reales y confiables.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                <div className="text-5xl mb-6 text-yellow-300">📱</div>
                <h3 className="text-xl font-bold text-white mb-3">Sorteos en Vivo</h3>
                <p className="text-white/80">
                  Muchos de nuestros sorteos se realizan en vivo a través de nuestras redes sociales para que todos puedan verificar su legitimidad.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
                <div className="text-5xl mb-6 text-yellow-300">🔒</div>
                <h3 className="text-xl font-bold text-white mb-3">Seguridad de Datos</h3>
                <p className="text-white/80">
                  Protegemos tus datos personales y financieros con los más altos estándares de seguridad de la industria.
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Preguntas Frecuentes</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Resolvemos tus dudas para que puedas participar con confianza
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-xl font-bold text-white mb-3">{item.question}</h3>
                    <p className="text-white/80">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Rules & Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Reglas y Términos</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Algunas consideraciones importantes para todos los usuarios
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Para Participantes</h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Debes ser mayor de 18 años para participar en cualquier rifa.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Una vez comprado, tu boleto no puede ser cancelado ni reembolsado.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Los ganadores tienen 30 días para reclamar su premio desde el anuncio oficial.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Asegúrate de proporcionar información de contacto válida para recibir notificaciones.</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Para Organizadores</h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Debes verificar tu identidad antes de crear una rifa.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>El premio ofrecido debe ser exactamente como se describe en la publicación.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Tienes la responsabilidad de entregar el premio al ganador en un plazo máximo de 15 días.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-300 mr-2">•</span>
                    <span>Puedes Registrate como Empresa para recibir grandes descuentos!</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link 
                href="/terminos-y-condiciones"
                className="text-yellow-300 hover:text-yellow-400 underline"
              >
                Ver términos y condiciones completos
              </Link>
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-10 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Únete a nuestra comunidad y comienza a disfrutar de la emoción de participar y crear rifas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/rifas"
                  className="bg-yellow-500 text-black hover:bg-yellow-400 transition-all px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Explorar Rifas
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-white/10 text-white hover:bg-white/20 transition-all px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
