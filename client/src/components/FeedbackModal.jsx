import React, { useState } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setLoading(true);
    try {
      await axios.post('/stats/feedback', { rating, comment });
      localStorage.setItem('calmly_feedback_given', 'true');
      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <h3 className="text-xl font-serif font-bold text-text mb-2">How is your experience?</h3>
        <p className="text-secondary text-sm mb-6">We'd love to hear your thoughts on Calmly.</p>

        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={star <= rating ? "fill-amber-400 text-amber-400" : "text-soft-border"}
              />
            </button>
          ))}
        </div>

        <textarea
          className="w-full bg-background border border-soft-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-accent outline-none resize-none mb-4 text-text placeholder:text-secondary"
          rows="3"
          placeholder="Any suggestions? (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface border border-soft-border text-text font-medium rounded-xl hover:bg-background transition"
          >
            Later
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FeedbackModal;
