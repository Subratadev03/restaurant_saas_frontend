import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import toast from 'react-hot-toast';
import { UtensilsCrossed } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    restaurantName: '', restaurantEmail: '', restaurantPhone: '',
    ownerFirstName: '', ownerLastName: '', ownerEmail: '', ownerPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register({
        restaurant: {
          name: form.restaurantName,
          email: form.restaurantEmail,
          phone: form.restaurantPhone,
        },
        owner: {
          firstName: form.ownerFirstName,
          lastName: form.ownerLastName,
          email: form.ownerEmail,
          password: form.ownerPassword,
        },
      });
      toast.success('Restaurant registered! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        required
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Restaurant</h1>
          <p className="text-gray-500 mt-1">Start your 14-day free trial</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Restaurant Details</h3>
              <div className="space-y-3">
                {field('restaurantName', 'Restaurant Name', 'text', 'The Grand Kitchen')}
                {field('restaurantEmail', 'Restaurant Email', 'email', 'contact@grandkitchen.com')}
                {field('restaurantPhone', 'Phone', 'tel', '+91 99999 00000')}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Owner Account</h3>
              <div className="grid grid-cols-2 gap-3">
                {field('ownerFirstName', 'First Name', 'text', 'Rahul')}
                {field('ownerLastName', 'Last Name', 'text', 'Sharma')}
              </div>
              <div className="mt-3 space-y-3">
                {field('ownerEmail', 'Email', 'email', 'rahul@grandkitchen.com')}
                {field('ownerPassword', 'Password', 'password', 'At least 8 characters')}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Restaurant'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
