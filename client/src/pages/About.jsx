import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-12 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
        </Link>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1 className="text-5xl font-serif font-bold mb-8 text-slate-900">About Calmly</h1>

            <div className="prose prose-lg prose-slate max-w-none">
                <p className="text-xl leading-relaxed text-slate-600 mb-12">
                    Calmly is a digital sanctuary designed for the unfiltered expression of the human experience.
                    In a world of curated highlights, we provide a canvas for the raw, the real, and the unspoken.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    <div>
                        <h3 className="text-2xl font-serif font-bold mb-4">Our Mission</h3>
                        <p className="text-slate-600">
                            To destigmatize emotional vulnerability by providing a platform where identity is fluid and privacy is paramount.
                            We believe everyone deserves a calm space to unload their thoughts without fear of judgment or permanence.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif font-bold mb-4">Our Philosophy</h3>
                        <p className="text-slate-600">
                            We value authenticity over engagement. We believe that writing is healing, and that shared stories can bridge the gap between strangers.
                            Here, you are free to be whoever you need to be in the moment.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl mb-16">
                    <h3 className="text-2xl font-serif font-bold mb-6">The Team</h3>
                    <p className="text-slate-600 mb-4">
                        Calmly is built by a small, passionate team dedicated to mental wellness and digital privacy.
                    </p>
                    <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">DR</div>
                         <div>
                             <p className="font-bold text-slate-900">Drib Ramirez</p>
                             <p className="text-sm text-slate-500">Founder & Lead Developer</p>
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
