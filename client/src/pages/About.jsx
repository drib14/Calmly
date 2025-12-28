import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6 text-center">About Calmly</h1>
        <p className="text-lg text-slate-600 leading-relaxed text-center max-w-2xl mx-auto mb-16">
          Calmly is a digital sanctuary designed for authentic emotional expression. In a world of noise, we provide a quiet space to be yourself—whoever that may be today.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 mb-3">Our Mission</h3>
                <p className="text-slate-600 leading-relaxed">
                    To destigmatize emotional vulnerability by providing a platform where identity is fluid and privacy is paramount. We believe everyone deserves a safe space to unload their thoughts without fear of judgment or permanence.
                </p>
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 mb-3">How It Works</h3>
                <p className="text-slate-600 leading-relaxed">
                    Create multiple personas: a Real Identity for friends, Pseudonyms for creative writing, and Anonymous mode for your deepest confessions. You control who sees what.
                </p>
            </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Join the Silence</h2>
            <p className="text-slate-500 mb-6">Experience social media without the noise.</p>
            <a href="/register" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-full font-medium hover:bg-slate-800 transition">Get Started</a>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
