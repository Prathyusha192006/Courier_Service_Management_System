export const distanceKm = (a = {}, b = {}) => {
  if(!a.lat || !a.lng || !b.lat || !b.lng) return 10; // default
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
  return Math.round(R * c);
};

export const suggestPrice = (from, to, type = 'standard') => {
  const base = 50; // base fee
  const perKm = 5; // per km
  const dist = distanceKm(from, to);
  const price = base + perKm * dist;
  return Math.round(type === 'express' ? price * 1.4 : price);
};
