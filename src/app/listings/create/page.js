'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import ListingCard from '@/components/ListingCard';
import { getDraft, saveDraft, clearDraft, daysRemaining } from '@/lib/store';
import { CATEGORIES, CONDITIONS, CITIES, SERVICE_CATEGORIES } from '@/lib/mockData';
import { getSupabase } from '@/lib/supabase';

const STEPS = ['Category & Photo', 'Details', 'Preview'];

const EMPTY_FORM = {
  category: '',
  title: '',
  photo: null,
  photoPreview: '',
  description: '',
  condition: '',
  iHave: '',
  iWant: [],
  iWantText: '',
  city: '',
  openToOffers: false,
};

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            i < step ? 'bg-green-800 text-white' :
            i === step ? 'bg-green-800 text-white ring-2 ring-green-300' :
            'bg-gray-200 text-gray-500'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-green-800' : 'text-gray-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 ${i < step ? 'bg-green-800' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateListing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      let { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!prof) {
        const emailName = authUser.email?.split('@')[0] || 'Trader';
        const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        const { data: newProf } = await supabase
          .from('profiles')
          .insert({ id: authUser.id, name, city: 'Bentonville', zip: '72712', completed_trades: 0 })
          .select()
          .single();
        prof = newProf;
      }
      setProfile(prof);

      const draft = getDraft();
      if (draft) setForm({ ...EMPTY_FORM, ...draft });
    }
    checkAuth();
  }, []);

  function update(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    saveDraft(updated);
  }

  function toggleIWant(cat) {
    const updated = form.iWant.includes(cat)
      ? form.iWant.filter((c) => c !== cat)
      : [...form.iWant, cat];
    update('iWant', updated);
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => {
        const updated = { ...prev, photo: file, photoPreview: ev.target.result };
        saveDraft(updated);
        return updated;
      });
    };
    reader.readAsDataURL(file);
  }

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.category) errs.category = 'Select a category';
      if (!form.title.trim()) errs.title = 'Add a title';
      if (form.title.trim().length > 0 && form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
      if (!form.iHave.trim()) errs.iHave = 'Describe what you have';
    }
    if (s === 1) {
      if (!form.iWantText.trim()) errs.iWantText = 'Describe what you want';
      if (form.iWant.length === 0) errs.iWant = 'Select at least one category you want';
      if (!form.city) errs.city = 'Select your city';
    }
    return errs;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(step + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const supabase = getSupabase();
      let photoUrl = null;

      // Upload photo if provided
      if (form.photo) {
        const ext = form.photo.name.split('.').pop();
        const filename = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('listing-photos')
          .upload(filename, form.photo, { upsert: true });

        if (uploadErr) {
          console.error('Photo upload error:', JSON.stringify(uploadErr));
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(filename);
          photoUrl = publicUrl;
        }
      }

      const now = new Date();
      const { data: inserted, error: insertErr } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          condition: SERVICE_CATEGORIES.includes(form.category) ? null : (form.condition || 'Good'),
          offering: form.iHave,
          seeking: form.iWant.length > 0 ? form.iWant : [form.iWantText],
          city: form.city,
          open_to_offers: form.openToOffers,
          photo_url: photoUrl,
          view_count: 0,
          status: 'active',
          expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('Insert error:', JSON.stringify(insertErr));
        throw insertErr;
      }

      clearDraft();
      router.push(`/listings/${inserted.id}`);
    } catch (err) {
      setSubmitError('Failed to post listing. Please try again.');
      setSubmitting(false);
    }
  }

  const isService = SERVICE_CATEGORIES.includes(form.category);

  const previewListing = {
    ...form,
    id: 'preview',
    condition: isService ? null : form.condition || 'Good',
    views: 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    photo: form.photoPreview || null,
    poster: profile ? {
      id: user?.id,
      name: profile.name,
      city: profile.city,
      zip: profile.zip,
      completedTrades: profile.completed_trades || 0,
    } : null,
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Post a Trade</h1>
      </div>

      <StepIndicator step={step} />

      {/* Step 0: Category + Title + Photo */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors text-left ${
                    form.category === cat
                      ? 'border-green-700 bg-green-50 text-green-900'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              What I have <span className="text-red-500">*</span>
            </label>
            <input
              value={form.iHave}
              onChange={(e) => {
                const val = e.target.value;
                const updated = { ...form, iHave: val, title: val };
                setForm(updated);
                saveDraft(updated);
              }}
              placeholder="e.g. Lawn mowing service, Standing desk, Guitar lessons..."
              maxLength={80}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            <div className="flex justify-between mt-1">
              {errors.iHave ? <p className="text-red-500 text-xs">{errors.iHave}</p> : <span />}
              <span className="text-xs text-gray-400">{form.iHave.length}/80</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Photo (optional)</label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {form.photoPreview ? (
                <img src={form.photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm font-medium">Click to upload a photo</div>
                  <div className="text-xs mt-1">JPG, PNG, WebP</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {form.photoPreview && (
              <button className="text-xs text-red-500 mt-1 hover:underline" onClick={() => { update('photoPreview', ''); update('photo', null); }}>
                Remove photo
              </button>
            )}
          </div>

          <button
            onClick={nextStep}
            className="w-full bg-green-800 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
          >
            Next: Add Details →
          </button>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={5}
              placeholder="Describe what you're offering in detail. The more specific, the better the match!"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {!isService && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Condition</label>
              <div className="flex gap-2 flex-wrap">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update('condition', c)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                      form.condition === c
                        ? 'border-green-700 bg-green-50 text-green-900'
                        : 'border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              What I want — categories <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleIWant(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                    form.iWant.includes(cat)
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 text-gray-600 hover:border-amber-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.iWant && <p className="text-red-500 text-xs mt-1">{errors.iWant}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              What I want — describe it <span className="text-red-500">*</span>
            </label>
            <input
              value={form.iWantText}
              onChange={(e) => update('iWantText', e.target.value)}
              placeholder="e.g. Road bike or mountain bike, any brand"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            {errors.iWantText && <p className="text-red-500 text-xs mt-1">{errors.iWantText}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Your city <span className="text-red-500">*</span>
            </label>
            <select
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
            >
              <option value="">Select city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          <div
            className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer select-none"
            onClick={() => update('openToOffers', !form.openToOffers)}
          >
            <div className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${form.openToOffers ? 'bg-amber-400' : 'bg-gray-300'}`}>
              <div
                style={{ transform: form.openToOffers ? 'translateX(24px)' : 'translateX(2px)' }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Open to offers</div>
              <div className="text-xs text-gray-500">Willing to consider trades not on my want list</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={nextStep}
              className="flex-2 flex-1 bg-green-800 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              Preview →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-xl p-4 text-sm text-green-800">
            <div className="font-bold mb-1">✅ Looks good! Here's how your listing will appear.</div>
            <div className="text-green-700">Review the card and full detail below before posting.</div>
          </div>

          {/* Card Preview */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card preview</div>
            <div className="max-w-xs">
              <ListingCard listing={previewListing} />
            </div>
          </div>

          {/* Full detail preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full listing preview</div>
            <h2 className="text-xl font-black text-gray-900">{form.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">{form.category}</span>
              {!isService && form.condition && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">{form.condition}</span>
              )}
              {form.openToOffers && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Open to offers</span>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-sm space-y-1">
              <div><span className="font-bold text-green-700">Have:</span> {form.iHave}</div>
              <div><span className="font-bold text-amber-600">Want:</span> {form.iWantText}</div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{form.description}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{form.city}</span>
              <span>·</span>
              <span>30 days left</span>
              <span>·</span>
              <span>0 views</span>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={submitting}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ← Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-green-800 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : '🌱 Post Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
