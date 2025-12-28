import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PenTool, Heart, Shield, Lock, Ghost, Users } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">

      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] animate-breath" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[120px] animate-breath delay-1000" />
      </div>

      <nav className="relative z-10 container mx-auto px-6 py-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-serif font-bold">C</div>
              <span className="font-serif font-bold text-xl text-slate-900">Calmly</span>
          </div>
          <div className="flex items-center space-x-6">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Log In</Link>
              <Link to="/register" className="text-sm font-medium bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">
                  Get Started
              </Link>
          </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 border border-blue-100">
                  A Safe Space for Your Soul
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                  Speak Freely.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-slate-800">Be Yourself.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Calmly is a digital sanctuary for emotional expression. Share confessions, poetry, and letters with total control over your identity.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <Link to="/register" className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-medium text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 flex items-center justify-center space-x-2">
                      <PenTool size={20} />
                      <span>Start Writing</span>
                  </Link>
                  <Link to="/about" className="w-full md:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-medium text-lg hover:bg-slate-50 transition flex items-center justify-center">
                      Learn More
                  </Link>
              </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto"
          >
              {[
                  { icon: Ghost, title: "Total Anonymity", desc: "Post anonymously with our Incognito identity system. Your secrets are safe." },
                  { icon: Users, title: "Multiple Personas", desc: "Create pseudonyms for different sides of your creative expression." },
                  { icon: Lock, title: "Private Journals", desc: "Keep a secure, encrypted personal journal for your eyes only." }
              ].map((feature, i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-700">
                          <feature.icon size={24} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">{feature.title}</h3>
                      <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                  </div>
              ))}
          </motion.div>
      </div>
    </div>
  );
};

export default Landing;
