import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PenTool, Heart, Shield, Lock, Ghost, Users, Activity } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Avatar from '../components/Avatar';

const Landing = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/stats/public');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
        // Fallback for demo/dev if stats fail
        setStats({
            totalPosts: 1243,
            activeUsers: 89,
            postsPerDay: [
                { _id: '2023-10-01', count: 12 },
                { _id: '2023-10-02', count: 19 },
                { _id: '2023-10-03', count: 15 },
                { _id: '2023-10-04', count: 25 },
                { _id: '2023-10-05', count: 32 },
            ],
            feedbacks: [
                { _id: '1', user: { name: 'Alex M.', avatar: null }, rating: 5, comment: 'A place where I can finally breathe.' },
                { _id: '2', user: { name: 'Sarah J.', avatar: null }, rating: 5, comment: 'The anonymity gives me courage.' },
                { _id: '3', user: { name: 'Mike T.', avatar: null }, rating: 4, comment: 'Beautiful interface and community.' }
            ]
        });
      }
    };
    fetchStats();
  }, []);

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
                  A Calm Space for Your Soul
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

          {/* Stats Section */}
          {stats && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-20 max-w-5xl mx-auto"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Activity Graph */}
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100">
                         <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.totalPosts}</h3>
                                <p className="text-slate-500 text-sm">Total Stories Shared</p>
                            </div>
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                                <PenTool size={20} />
                            </div>
                         </div>
                         <div className="h-[200px] w-full min-h-[200px]">
                            {/* Explicit width/height to prevent Recharts -1/-1 error during initial render/animation */}
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={stats.postsPerDay}>
                                    <XAxis
                                        dataKey="_id"
                                        tickFormatter={(date) => {
                                            const d = new Date(date);
                                            return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
                                        }}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                         </div>
                    </div>

                    {/* Active Users */}
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                         <div className="flex items-center justify-between mb-8">
                            <div className="text-left">
                                <h3 className="text-4xl font-serif font-bold text-slate-900">{stats.activeUsers}</h3>
                                <p className="text-slate-500">Active Community Members</p>
                            </div>
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                <Users size={32} />
                            </div>
                         </div>
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-emerald-400"
                             />
                         </div>
                         <p className="text-left text-xs text-slate-400 mt-2">Growing stronger every day</p>
                    </div>
                </div>

                {/* Feedbacks */}
                <div className="text-left mb-8">
                    <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 text-center">Community Voices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.feedbacks.map((fb) => (
                            <div key={fb._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3 mb-4">
                                    {/* Mock Avatar or Initials if none */}
                                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">
                                        {fb.user.avatar ? <img src={fb.user.avatar} className="w-full h-full rounded-full object-cover" /> : fb.user.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{fb.user.name}</p>
                                        <div className="flex text-amber-400">
                                            {[...Array(fb.rating)].map((_, i) => <span key={i} className="text-xs">★</span>)}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">"{fb.comment || "No comment provided."}"</p>
                            </div>
                        ))}
                    </div>
                </div>

            </motion.div>
          )}

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto"
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
