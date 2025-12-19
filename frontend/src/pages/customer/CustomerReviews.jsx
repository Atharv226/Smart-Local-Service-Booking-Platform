import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function CustomerReviews() {
  const { api } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes] = await Promise.all([
          api.get('/customers/bookings'),
        ]);
        setBookings(bRes.data || []);
        // Set reviews from bookings that have them
        const reviewedBookings = (bRes.data || [])
          .filter(b => b.rating && b.review)
          .map(b => ({
            _id: b._id,
            provider: b.provider,
            rating: b.rating,
            comment: b.review,
            createdAt: b.updatedAt || new Date(),
          }));
        setReviews(reviewedBookings);
      } catch {
        // ignore
      }
    };
    load();
  }, [api]);

  const handleSubmitReview = async () => {
    if (!selectedBooking || !reviewText.trim()) {
      showToast('Please select a booking and write a review', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bookings/${selectedBooking}/review`, {
        rating,
        review: reviewText,
      });
      showToast('Review submitted successfully!', 'success');
      
      // Update local state
      const updatedBooking = data.booking;
      setBookings((prev) => 
        prev.map(b => b._id === updatedBooking._id ? updatedBooking : b)
      );
      setReviews((prev) => [
        {
          _id: updatedBooking._id,
          provider: updatedBooking.provider || bookings.find(b => b._id === selectedBooking)?.provider,
          rating: updatedBooking.rating,
          comment: updatedBooking.review,
          createdAt: new Date(),
        },
        ...prev
      ]);

      setReviewText('');
      setRating(5);
      setSelectedBooking(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const completedBookings = bookings.filter((b) => b.status === 'completed' && !b.rating);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-sm text-slate-400">
          Rate and review service providers to help others make informed decisions.
        </p>
      </motion.div>

      {/* Write Review Section */}
      {completedBookings.length > 0 && (
        <motion.div
          className="rounded-xl border border-slate-700 bg-slate-800 p-6"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <h2 className="mb-4 text-lg font-bold text-white">Write a Review</h2>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Select Completed Booking
            </label>
            <select
              value={selectedBooking || ''}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="" className="bg-slate-700">Select a booking...</option>
              {completedBookings.map((booking) => (
                <option key={booking._id} value={booking._id} className="bg-slate-700">
                  Booking #{booking._id.slice(-6)} - {booking.provider?.user?.fullName || 'Provider'}
                </option>
              ))}
            </select>
          </div>

          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all ${
                        star <= rating ? 'text-yellow-400' : 'text-slate-600'
                      }`}
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ⭐
                    </motion.button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-400">{rating} out of 5 stars</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this service provider..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <motion.button
                type="button"
                onClick={handleSubmitReview}
                disabled={submitting || !reviewText}
                className="w-full rounded-lg bg-primary-500 px-4 py-3 font-bold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Your Reviews */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <h2 className="mb-4 text-lg font-bold text-white">Your Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400">
            You haven&apos;t written any reviews yet. Complete a service to leave your first review!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review._id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {review.provider?.user?.fullName || 'Provider'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {review.provider?.serviceType || 'Service'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= review.rating ? 'text-yellow-400' : 'text-slate-600'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-300">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default CustomerReviews;

