'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES, CONDITIONS, CITIES, SERVICE_CATEGORIES } from '@/lib/mockData';
import { getSupabase } from '@/lib/supabase';

export default function EditListing() {
  const { id } = useParams();
  const router = useRouter();
  const fileRef = useRef();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    iHave: '',
    iWantText: '',
    city: '',
    openToOffers: false,
    newPhoto: null,
    newPhotoPreview: '',
  });

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) { router.push('/'); return; }
      if (data.user_id !== authUser.id) { router.push('/'); return; }

      setExistingPhotoUrl(data.photo_url || '');
      setForm({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        condition: data.condition || '',
        iHave: data.offering || '',
        iWantText: Array.isArray(data.seeking) ? data.seeking.join(', ') : (data.seeking || ''),
        city: data.city || '',
        openToOffers: data.open_to_offers || false,
        newPhoto: null,
        newPhotoPreview: '',
      });
      setLoading(false);
    }
    load();
  }, [id]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    update('newPhoto', file);
    const reader = new FileReader();
    reader.onload = (ev) => update('newPhotoPreview', ev.target.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
    if (!form.category) errs.category = 'Select a category';
    if (form.description.trim().length < 50) errs.description = `Description must be at least 50 characters (${form.description.trim().length}/50)`;
    if (!form.iHave.trim()) errs.iHave = 'Describe what you have';
    if (!form.iWantText.trim()) errs.iWantText = 'Describe what you want';
    if (!form.city) errs.city = 'Select your city';
    return errs;
  }

  async function handleSave(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    setSaveError('');

    try {
      const supabase = getSupabase();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let photoUrl = existingPhotoUrl;

      if (form.newPhoto) {
        const ext = form.newPhoto.name.split('.').pop();
        const filename = `${authUser.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('listing-photos')
          .upload(filename, form.newPhoto, { upsert: true });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(filename);
          photoUrl = publicUrl;
        }
      }

      const isService = SERVICE_CATEGORIES.includes(form.category);
      const { error: updateErr } = await supabase
        .from('listings')
        .update({
          title: form.title,
          description: form.description,
          category: form.category,
          condition: isService ? null : (form.condition || 'Good'),
          offering: form.iHave,
          seeking: [form.iWantText],
          city: form.city,
          open_to_offers: form.openToOffers,
          photo_url: photoUrl,
        })
        .eq('id', id);

      if (updateErr) throw updateErr;
      router.push(`/listings/${id}`);
    } catch {
      setSaveError('Failed to save listing. Please try again.');
      setSaving(false);
    }
  }

  const isService = SERVICE_CATEGORIES.includes(form.category);
  const displayPhoto = form.newPhotoPreview || existingPhotoUrl;

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D4B8E', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/listings/${id}`} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Edit Listing</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Category */}
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
                    ? 'border-blue-700 bg-blue-50 text-blue-900'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={80}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          <div className="flex justify-between mt-1">
            {errors.title ? <p className="text-red-500 text-xs">{errors.title}</p> : <span />}
            <span className="text-xs text-gray-400">{form.title.length}/80</span>
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Photo</label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {displayPhoto ? (
              <img src={displayPhoto} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
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
          {displayPhoto && (
            <button
              type="button"
              className="text-xs text-red-500 mt-1 hover:underline"
              onClick={() => { update('newPhoto', null); update('newPhotoPreview', ''); setExistingPhotoUrl(''); }}
            >
              Remove photo
            </button>
          )}
          {form.newPhotoPreview && (
            <p className="text-xs mt-1" style={{ color: '#2D4B8E' }}>New photo selected — will replace existing on save</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(50 char min)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
          />
          <div className="flex justify-between mt-1">
            {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <span />}
            <span className={`text-xs ${form.description.trim().length < 50 ? 'text-red-400' : 'text-blue-600'}`}>
              {form.description.trim().length}/50+
            </span>
          </div>
        </div>

        {/* Condition */}
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
                      ? 'border-blue-700 bg-blue-50 text-blue-900'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* I Have */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            What I have <span className="text-red-500">*</span>
          </label>
          <input
            value={form.iHave}
            onChange={(e) => update('iHave', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          {errors.iHave && <p className="text-red-500 text-xs mt-1">{errors.iHave}</p>}
        </div>

        {/* I Want */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            What I want <span className="text-red-500">*</span>
          </label>
          <input
            value={form.iWantText}
            onChange={(e) => update('iWantText', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          {errors.iWantText && <p className="text-red-500 text-xs mt-1">{errors.iWantText}</p>}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <select
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
          >
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>

        {/* Open to offers */}
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

        {saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href={`/listings/${id}`}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-center hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: '#2D4B8E' }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
