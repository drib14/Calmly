import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-serif mb-6 text-soft-dark leading-tight"
      >
        A Digital Sanctuary for<br/> <span className="text-muted-gold italic">Untold Stories</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed"
      >
        Express yourself through confessions, poetry, and letters.
        Choose your identity for every post. Find solace in a quiet community.
        <br/><br/>
        <span className="text-sm uppercase tracking-widest text-gray-400">Not Social Media. Just Human Connection.</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex space-x-4"
      >
        <Link to="/register" className="px-8 py-3 bg-sage text-white rounded-full text-lg hover:bg-green-700 transition shadow-md">
          Enter Safe Space
        </Link>
        <Link to="/login" className="px-8 py-3 border border-gray-300 rounded-full text-lg hover:border-muted-gold hover:text-muted-gold transition">
          Log In
        </Link>
      </motion.div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-serif text-xl mb-2 text-muted-gold">Identity Control</h3>
            <p className="text-sm text-gray-500">Post as your real self, a pseudonym, or completely anonymously. You decide per post.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-serif text-xl mb-2 text-muted-gold">Quiet Feed</h3>
            <p className="text-sm text-gray-500">No likes. No follower counts. Just reactions like "I hear you" and "Sending strength".</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="font-serif text-xl mb-2 text-muted-gold">Safe By Design</h3>
            <p className="text-sm text-gray-500">Built for mental health. Trigger warnings, soft moderation, and no doom-scrolling.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
