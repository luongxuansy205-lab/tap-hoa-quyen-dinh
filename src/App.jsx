import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, MapPin, Phone, Plus, Minus, Trash2, X, Store, Package, ClipboardList, LogIn, LogOut, ImagePlus, Pencil, CheckCircle2 } from 'lucide-react';
import { hasSupabase, supabase } from './lib/supabase';

const initialProducts = [
  { id:'p1', name:'Dầu ăn thực vật (mẫu)', category:'Đồ khô', price:35000, image:'', description:'Vui lòng cập nhật đúng thương hiệu và dung tích trước khi bán.' },
  { id:'p2', name:'Mì ăn liền (mẫu)', category:'Đồ khô', price:5000, image:'', description:'Sản phẩm mẫu – thay bằng sản phẩm thực tế.' },
  { id:'p3', name:'Nước suối (mẫu)', category:'Đồ uống', price:6000, image:'', description:'Sản phẩm mẫu – thay bằng sản phẩm thực tế.' },
  { id:'p4', name:'Rau xanh (mẫu)', category:'Rau củ', price:12000, image:'', description:'Sản phẩm mẫu – thay bằng sản phẩm thực tế.' },
  { id:'p5', name:'Trái cây theo mùa (mẫu)', category:'Trái cây', price:25000, image:'', description:'Sản phẩm mẫu – thay bằng sản phẩm thực tế.' },
  { id:'p6', name:'Thịt sạch (mẫu)', category:'Thịt sạch', price:85000, image:'', description:'Sản phẩm mẫu – thay bằng sản phẩm thực tế.' }
];
const categories = ['Tất cả','Đồ khô','Thịt sạch','Rau củ','Trái cây','Đồ uống','Bánh kẹo','Hóa mỹ phẩm','Gia dụng','Khác'];
const money = n => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(n)||0);
const readLocal = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export default function App() {
  const [products,setProducts] = useState(() => readLocal('tqd_products', initialProducts));
  const [orders,setOrders] = useState(() => readLocal('tqd_orders', []));
  const [cart,setCart] = useState(() => readLocal('tqd_cart', []));
  const [category,setCategory] = useState('Tất cả');
  const [query,setQuery] = useState('');
  const [showCart,setShowCart] = useState(false);
  const [checkout,setCheckout] = useState(false);
  const [admin,setAdmin] = useState(false);
  const [adminLogin,setAdminLogin] = useState(false);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [editing,setEditing] = useState(null);
  const [customer,setCustomer] = useState({name:'',phone:'',address:'',note:'',zone:'near'});
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const storeName = import.meta.env.VITE_STORE_NAME || 'Tạp Hoá Quyên Định';
  const mapUrl = import.meta.env.VITE_STORE_MAP || 'https://maps.app.goo.gl/LAonBNa7XfeUFwC3A?g_st=ic';

  useEffect(() => { localStorage.setItem('tqd_products',JSON.stringify(products)); },[products]);
  useEffect(() => { localStorage.setItem('tqd_orders',JSON.stringify(orders)); },[orders]);
  useEffect(() => { localStorage.setItem('tqd_cart',JSON.stringify(cart)); },[cart]);
  useEffect(() => {
    if (!hasSupabase) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at',{ascending:false});
      if (!error && active && data?.length) setProducts(data.map(p=>({...p,price:Number(p.price)})));
      const { data: auth } = await supabase.auth.getSession();
      if (active && auth?.session) setAdmin(true);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event,session)=>setAdmin(Boolean(session)));
    return () => { active=false; listener.subscription.unsubscribe(); };
  },[]);

  const filtered = useMemo(()=>products.filter(p=>(category==='Tất cả'||p.category===category) && p.name.toLowerCase().includes(query.toLowerCase())),[products,category,query]);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping = customer.zone==='near'?0:20000;
  const total = subtotal + shipping;

  function add(p) { setCart(old=>{const found=old.find(i=>i.id===p.id);return found?old.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...old,{...p,qty:1}];}); setMessage('Đã thêm vào giỏ hàng'); }
  function changeQty(id,delta) { setCart(old=>old.map(i=>i.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0)); }
  function saveProduct(e) {
    e.preventDefault();
    const p={...editing,price:Number(editing.price)||0};
    if (hasSupabase) {
      (async()=>{ const payload={name:p.name,category:p.category,price:p.price,image:p.image||'',description:p.description||''};
        const result=p.id?await supabase.from('products').update(payload).eq('id',p.id):await supabase.from('products').insert(payload).select().single();
        if(result.error){setMessage('Chưa lưu được lên máy chủ: '+result.error.message);return;}
        if(result.data && !p.id) setProducts(old=>[result.data,...old]); else setProducts(old=>old.map(x=>x.id===p.id?p:x));
        setEditing(null);setMessage('Đã lưu sản phẩm lên hệ thống.');
      })();
    } else {
      setProducts(old=>p.id?old.map(x=>x.id===p.id?p:x):[{...p,id:crypto.randomUUID()},...old]);
      setEditing(null);setMessage('Đã lưu trên trình duyệt này. Kết nối Supabase để đồng bộ nhiều thiết bị.');
    }
  }
  async function deleteProduct(p) {
    if(!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    if(hasSupabase){const {error}=await supabase.from('products').delete().eq('id',p.id);if(error){setMessage(error.message);return;}}
    setProducts(old=>old.filter(x=>x.id!==p.id));
  }
  async function placeOrder(e) {
    e.preventDefault(); if(!cart.length)return;
    setBusy(true);
    const order={customer_name:customer.name,phone:customer.phone,address:customer.address,note:customer.note,delivery_zone:customer.zone,subtotal,shipping,total,items:cart.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty})),status:'Mới'};
    if(hasSupabase){const {error}=await supabase.from('orders').insert(order);if(error){setMessage('Không gửi được đơn: '+error.message);setBusy(false);return;}}
    const saved={...order,id:crypto.randomUUID(),created_at:new Date().toISOString()};
    setOrders(old=>[saved,...old]);setCart([]);setCheckout(false);setShowCart(false);setCustomer({name:'',phone:'',address:'',note:'',zone:'near'});
    setMessage(hasSupabase?'Đặt hàng thành công! Cửa hàng đã nhận đơn.':'Đã tạo đơn trên trình duyệt này. Cần kết nối Supabase để cửa hàng nhận đơn từ thiết bị khác.');
    setBusy(false);
  }
  async function login(e){e.preventDefault();if(!hasSupabase){setMessage('Cần cấu hình Supabase và tạo tài khoản quản trị trước.');return;}const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMessage('Đăng nhập chưa thành công: '+error.message);return;}setAdmin(true);setAdminLogin(false);setPassword('');}
  async function logout(){if(hasSupabase)await supabase.auth.signOut();setAdmin(false);}
  async function uploadImage(file){if(!file)return;if(!hasSupabase){setMessage('Cần kết nối Supabase Storage để tải ảnh lên. Bạn có thể dán đường dẫn ảnh vào ô Ảnh.');return;}const ext=file.name.split('.').pop();const path=`${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;const {error}=await supabase.storage.from('product-images').upload(path,file,{upsert:true});if(error){setMessage(error.message);return;}const {data}=supabase.storage.from('product-images').getPublicUrl(path);setEditing(x=>({...x,image:data.publicUrl}));}

  return <div className="app">
    <div className="topline">Tạp hoá gần nhà – tiện lợi mỗi ngày</div>
    <header className="header wrap">
      <a className="brand" href="#"><span className="brand-icon"><Store size={25}/></span><span><b>{storeName}</b><small>Đặt hàng nhanh – Giao tận nơi</small></span></a>
      <div className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm sản phẩm bạn cần..."/></div>
      <button className="cart-button" onClick={()=>{setShowCart(true);setCheckout(false)}}><ShoppingCart size={20}/> Giỏ hàng <b>{cartCount}</b></button>
    </header>
    <main className="wrap">
      <section className="hero">
        <div><span className="eyebrow">CHÀO MỪNG BẠN ĐẾN VỚI</span><h1>{storeName}</h1><p>Lựa chọn những mặt hàng thiết yếu mỗi ngày. Đặt hàng dễ dàng, thanh toán khi nhận hàng.</p><button className="primary" onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})}>Mua sắm ngay</button></div>
        <div className="hero-art"><div className="basket">🛒</div><div className="produce">🥬 🍎 🥖 🥛</div><span>Hàng thiết yếu mỗi ngày</span></div>
      </section>
      <section className="benefits"><div>🚚 <b>Giao hàng tận nơi</b><small>Miễn phí trong 3km*</small></div><div>💵 <b>Thanh toán COD</b><small>Trả tiền khi nhận hàng</small></div><div>🛍️ <b>Đặt hàng tiện lợi</b><small>Chọn nhiều món trong một đơn</small></div></section>
      <section id="products" className="products-section">
        <div className="section-head"><div><span className="eyebrow">DANH MỤC & SẢN PHẨM</span><h2>Mua sắm tại cửa hàng</h2></div><span className="muted">{filtered.length} sản phẩm</span></div>
        <div className="categories">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="product-grid">{filtered.map(p=><article className="product" key={p.id}><div className="product-image">{p.image?<img src={p.image} alt={p.name}/>:<span>🛍️</span>}</div><div className="product-info"><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><b>{money(p.price)}</b><button aria-label="Thêm vào giỏ" onClick={()=>add(p)}><Plus size={18}/></button></div></div></article>)}</div>
        {!filtered.length&&<div className="empty">Chưa có sản phẩm phù hợp. Bạn thử tìm từ khóa khác nhé.</div>}
      </section>
      <section className="store-info"><div><span className="eyebrow">THÔNG TIN CỬA HÀNG</span><h2>Ghé thăm chúng tôi</h2><p><MapPin size={17}/> Địa chỉ cửa hàng: xem vị trí trên bản đồ</p><p><Phone size={17}/> Hotline: vui lòng cập nhật số điện thoại cửa hàng</p><a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">Mở bản đồ và chỉ đường ↗</a></div><div className="map-card"><MapPin size={34}/><b>Vị trí Tạp Hoá Quyên Định</b><a href={mapUrl} target="_blank" rel="noreferrer">Xem trên Google Maps</a></div></section>
      <footer><b>{storeName}</b><span>© {new Date().getFullYear()} – Website cửa hàng</span><button className="admin-link" onClick={()=>{setAdminLogin(true);setAdmin(false)}}>Quản trị cửa hàng</button></footer>
    </main>

    {showCart&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowCart(false)}}><aside className="drawer"><div className="drawer-head"><h2>{checkout?'Thông tin đặt hàng':'Giỏ hàng của bạn'}</h2><button className="icon-btn" onClick={()=>setShowCart(false)}><X/></button></div>
      {!checkout?<><div className="cart-list">{cart.map(i=><div className="cart-row" key={i.id}><div className="mini-img">{i.image?<img src={i.image}/>: '🛍️'}</div><div className="cart-desc"><b>{i.name}</b><small>{money(i.price)}</small><div className="qty"><button onClick={()=>changeQty(i.id,-1)}><Minus size={14}/></button>{i.qty}<button onClick={()=>changeQty(i.id,1)}><Plus size={14}/></button></div></div><b>{money(i.price*i.qty)}</b></div>)}{!cart.length&&<div className="empty">Giỏ hàng đang trống.</div>}</div><div className="drawer-foot"><div className="sum"><span>Tạm tính</span><b>{money(subtotal)}</b></div><button className="primary full" disabled={!cart.length} onClick={()=>setCheckout(true)}>Tiến hành đặt hàng</button></div></>:<form className="checkout-form" onSubmit={placeOrder}><label>Họ và tên<input required value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Tên người nhận"/></label><label>Số điện thoại<input required inputMode="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="Số điện thoại"/></label><label>Địa chỉ giao hàng<textarea required value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="Số nhà, đường, phường/xã..."/></label><label>Ghi chú<textarea value={customer.note} onChange={e=>setCustomer({...customer,note:e.target.value})} placeholder="Ghi chú cho cửa hàng (nếu có)"/></label><label>Khu vực giao hàng<select value={customer.zone} onChange={e=>setCustomer({...customer,zone:e.target.value})}><option value="near">Trong bán kính 3km – miễn phí</option><option value="far">Trên 3km – phí 20.000đ</option></select></label><div className="notice">Thanh toán khi nhận hàng (COD). Phí giao hàng do khách chọn theo khu vực; cửa hàng cần xác nhận lại địa chỉ.</div><div className="sum"><span>Tổng thanh toán</span><b>{money(total)}</b></div><button className="primary full" disabled={busy}>{busy?'Đang gửi đơn...':'Xác nhận đặt hàng'}</button><button type="button" className="back-link" onClick={()=>setCheckout(false)}>← Quay lại giỏ hàng</button></form>}
    </aside></div>}

    {adminLogin&&<div className="overlay"><div className="modal"><button className="modal-x" onClick={()=>setAdminLogin(false)}><X/></button><LogIn size={30}/><h2>Đăng nhập quản trị</h2><p>Đăng nhập bằng tài khoản quản trị Supabase đã tạo.</p><form onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mật khẩu<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary full">Đăng nhập</button></form></div></div>}

    {admin&&<div className="admin-panel"><div className="admin-head"><div><span className="eyebrow">KHU VỰC QUẢN TRỊ</span><h2>Quản lý cửa hàng</h2></div><button className="outline" onClick={logout}><LogOut size={16}/> Đăng xuất</button></div><div className="admin-tabs"><b><Package size={17}/> Sản phẩm ({products.length})</b><b><ClipboardList size={17}/> Đơn hàng ({orders.length})</b></div><div className="admin-actions"><button className="primary" onClick={()=>setEditing({name:'',category:'Đồ khô',price:'',image:'',description:''})}><Plus size={17}/> Thêm sản phẩm</button><span className="muted">Dữ liệu đơn hàng từ Supabase sẽ được đồng bộ giữa các thiết bị.</span></div><div className="admin-table">{products.map(p=><div className="admin-product" key={p.id}><span>{p.name}</span><b>{money(p.price)}</b><button className="icon-btn" onClick={()=>setEditing({...p})}><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>deleteProduct(p)}><Trash2 size={16}/></button></div>)}</div><h3>Đơn hàng gần đây</h3>{orders.slice(0,20).map(o=><div className="order-card" key={o.id}><b>{o.customer_name} · {money(o.total)}</b><small>{o.phone} · {o.address}</small><small>{new Date(o.created_at).toLocaleString('vi-VN')}</small></div>)}{!orders.length&&<p className="muted">Chưa có đơn hàng được lưu trên trình duyệt này.</p>}</div>}

    {editing&&<div className="overlay"><div className="modal wide"><button className="modal-x" onClick={()=>setEditing(null)}><X/></button><h2>{editing.id?'Sửa sản phẩm':'Thêm sản phẩm'}</h2><form onSubmit={saveProduct}><label>Tên sản phẩm<input required value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>Danh mục<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{categories.filter(x=>x!=='Tất cả').map(c=><option key={c}>{c}</option>)}</select></label><label>Giá bán (VNĐ)<input required type="number" min="0" value={editing.price} onChange={e=>setEditing({...editing,price:e.target.value})}/></label><label>Đường dẫn ảnh<input value={editing.image||''} onChange={e=>setEditing({...editing,image:e.target.value})} placeholder="Dán đường dẫn ảnh nếu có"/></label><label className="upload-label"><ImagePlus size={17}/> Hoặc chọn ảnh từ máy<input type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0])}/></label>{editing.image&&<img className="preview" src={editing.image} alt="Xem trước"/>}<label>Mô tả<textarea value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><button className="primary full">Lưu sản phẩm</button></form></div></div>}
    {message&&<div className="toast" onClick={()=>setMessage('')}><CheckCircle2 size={18}/>{message}<X size={16}/></div>}
  </div>;
}