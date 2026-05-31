import { useState, useEffect } from "react";

const WEBHOOK_URL = "https://alifaraji.app.n8n.cloud/webhook-test/ghadir-register";
const EVENT_DATE  = new Date("2026-06-10T13:00:00Z");

/* ══════════════ Countdown ══════════════ */
function Countdown() {
  const [t, setT] = useState({ days:0, hours:0, minutes:0, seconds:0 });
  useEffect(() => {
    const calc = () => {
      const diff = EVENT_DATE - new Date();
      if (diff <= 0) return;
      setT({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  // LTR order: روز (left) → ثانیه (right)
  const units = [
    { label:"روز",   value:t.days },
    { label:"ساعت",  value:t.hours },
    { label:"دقیقه", value:t.minutes },
    { label:"ثانیه", value:t.seconds },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"row", gap:"10px", justifyContent:"center", direction:"ltr" }}>
      {units.map(({ label, value }) => (
        <div key={label} style={{
          background:"rgba(0,128,120,0.10)",
          border:"1.5px solid rgba(0,128,120,0.38)",
          borderRadius:"14px", padding:"14px 18px", minWidth:"72px", textAlign:"center",
        }}>
          <div style={{ fontSize:"2rem", fontWeight:"800", color:"#005c57", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>
            {String(value).padStart(2,"0")}
          </div>
          <div style={{ fontSize:"0.73rem", color:"#00867e", marginTop:"5px", fontFamily:"Vazirmatn,sans-serif" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════ RSVP Form ══════════════ */
function RSVPForm() {
  const [form, setForm]       = useState({ name:"", phone:"", attending:"yes", note:"" });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState("idle"); // idle|loading|success|error
  const [submitted, setSub]   = useState(null);
  const [editing, setEditing] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "نام و نام خانوادگی الزامی است";
    if (!form.phone.trim()) e.phone = "شماره موبایل الزامی است";
    else if (!/^09\d{9}$/.test(form.phone.trim())) e.phone = "شماره موبایل معتبر نیست (مثال: 09123456789)";
    return e;
  };

  const sendToN8n = async (payload) => {
    // Use no-cors so the browser doesn't block the cross-origin request.
    // The response will be opaque (we can't read it), but n8n will receive
    // the data. We treat the fetch completing without a network error as success.
    await fetch(WEBHOOK_URL, {
      method:  "POST",
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    // If fetch throws, it propagates to the caller.
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStatus("loading");
    try {
      await sendToN8n({ name: form.name, phone: form.phone, attending: form.attending, note: form.note });
      setSub({ ...form });
      setStatus("success");
      setEditing(false);
    } catch {
      setStatus("error");
    }
  };

  const handleEdit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStatus("loading");
    try {
      // Send updated data with an "edit" flag so n8n can distinguish
      await sendToN8n({ name: form.name, phone: form.phone, attending: form.attending, note: form.note, action: "edit" });
      setSub({ ...form });
      setStatus("success");
      setEditing(false);
    } catch {
      setStatus("error");
    }
  };

  const startEdit = () => {
    setForm({ ...submitted });
    setEditing(true);
    setStatus("idle");
  };

  const attendingLabel = {
    yes:   "ان‌شاءالله حضور دارم",
    maybe: "شاید حضور داشته باشم",
    no:    "متأسفانه نمی‌توانم",
  };

  /* shared styles */
  const inp = {
    width:"100%", padding:"13px 16px",
    background:"#fff",
    border:"1.5px solid rgba(0,128,120,0.28)",
    borderRadius:"10px", color:"#1a2e2c",
    fontSize:"0.97rem", fontFamily:"Vazirmatn,sans-serif",
    direction:"rtl", outline:"none",
    transition:"border-color 0.25s, box-shadow 0.25s",
    boxSizing:"border-box",
  };
  const lbl  = { display:"block", color:"#005c57", marginBottom:"7px", fontSize:"0.88rem", fontWeight:"700" };
  const errS = { color:"#b02020", fontSize:"0.78rem", marginTop:"4px" };

  /* ── Success view ── */
  if (status === "success" && !editing) return (
    <div>
      <div style={{ textAlign:"center", padding:"22px 16px 16px" }}>
        <div style={{
          width:"64px", height:"64px", borderRadius:"50%",
          background:"rgba(0,128,120,0.12)", border:"2px solid #008078",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 14px", fontSize:"1.8rem", color:"#005c57",
        }}>✓</div>
        <h3 style={{ color:"#005c57", fontSize:"1.22rem", marginBottom:"9px", fontWeight:"800" }}>
          ثبت‌نام با موفقیت انجام شد
        </h3>
        <p style={{ color:"#00867e", lineHeight:2, fontSize:"0.9rem" }}>
          از شرکت شما در این مجلس نورانی سپاسگزاریم.<br />منتظر حضور گرم‌تان هستیم.
        </p>
      </div>

      {/* Summary */}
      <div style={{ background:"rgba(0,128,120,0.06)", borderRadius:"12px", padding:"16px 20px", marginBottom:"16px", border:"1px solid rgba(0,128,120,0.18)" }}>
        {[
          ["نام",      submitted.name],
          ["موبایل",   submitted.phone],
          ["وضعیت",   attendingLabel[submitted.attending]],
          ["یادداشت", submitted.note || "—"],
        ].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid rgba(0,128,120,0.1)" }}>
            <span style={{ color:"#00867e", fontSize:"0.83rem" }}>{k}</span>
            <span style={{ color:"#005c57", fontWeight:"700", fontSize:"0.9rem", direction: k==="موبایل"?"ltr":"rtl" }}>{v}</span>
          </div>
        ))}
      </div>

      <button
        onClick={startEdit}
        style={{
          width:"100%", padding:"13px", background:"transparent",
          border:"2px solid rgba(0,128,120,0.4)", borderRadius:"10px",
          color:"#005c57", fontSize:"0.95rem", fontWeight:"700",
          fontFamily:"Vazirmatn,sans-serif", cursor:"pointer", transition:"all 0.25s",
        }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(0,128,120,0.08)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        ✏️ ویرایش اطلاعات ثبت‌شده
      </button>
    </div>
  );

  /* ── Form ── */
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
      {editing && (
        <div style={{
          background:"rgba(196,160,80,0.10)", border:"1px solid rgba(196,160,80,0.38)",
          borderRadius:"10px", padding:"11px 16px", color:"#7a5800",
          fontSize:"0.86rem", textAlign:"center",
        }}>
          در حال ویرایش اطلاعات ثبت‌شده — پس از تغییر، دکمه «ثبت تغییرات» را بزنید
        </div>
      )}

      {/* Name */}
      <div>
        <label style={lbl}>نام و نام خانوادگی *</label>
        <input
          style={{ ...inp, borderColor: errors.name ? "#b02020" : "rgba(0,128,120,0.28)" }}
          placeholder="نام کامل خود را وارد کنید"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        />
        {errors.name && <p style={errS}>{errors.name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label style={lbl}>شماره موبایل *</label>
        <input
          style={{ ...inp, borderColor: errors.phone ? "#b02020" : "rgba(0,128,120,0.28)", direction:"ltr", textAlign:"right" }}
          placeholder="09xxxxxxxxx"
          value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          type="tel"
          maxLength={11}
        />
        {errors.phone && <p style={errS}>{errors.phone}</p>}
      </div>

      {/* Attending */}
      <div>
        <label style={lbl}>وضعیت حضور</label>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {[
            { value:"yes",   label:"ان‌شاءالله حضور دارم" },
            { value:"maybe", label:"شاید حضور داشته باشم" },
            { value:"no",    label:"متأسفانه نمی‌توانم"   },
          ].map(opt => (
            <label key={opt.value} style={{
              display:"flex", alignItems:"center", gap:"10px", cursor:"pointer",
              padding:"12px 15px", borderRadius:"10px", direction:"rtl",
              color:"#1a2e2c", fontSize:"0.93rem",
              background: form.attending===opt.value ? "rgba(0,128,120,0.10)" : "#f7fffe",
              border:`1.5px solid ${form.attending===opt.value ? "rgba(0,128,120,0.52)" : "rgba(0,128,120,0.18)"}`,
              transition:"all 0.2s",
            }}>
              <input
                type="radio" name="attending" value={opt.value}
                checked={form.attending===opt.value}
                onChange={()=>setForm(p=>({...p,attending:opt.value}))}
                style={{ accentColor:"#008078" }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label style={lbl}>پیام یا یادداشت (اختیاری)</label>
        <textarea
          style={{ ...inp, minHeight:"88px", resize:"vertical" }}
          placeholder="اگر پیامی دارید بنویسید..."
          value={form.note}
          onChange={e=>setForm(p=>({...p,note:e.target.value}))}
        />
      </div>

      {status==="error" && (
        <div style={{
          background:"rgba(176,32,32,0.07)", border:"1px solid rgba(176,32,32,0.3)",
          borderRadius:"10px", padding:"12px", color:"#b02020",
          textAlign:"center", fontSize:"0.88rem",
        }}>
          خطا در ارسال اطلاعات. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.
        </div>
      )}

      <button
        onClick={editing ? handleEdit : handleSubmit}
        disabled={status==="loading"}
        style={{
          padding:"15px", borderRadius:"12px", border:"none",
          background: status==="loading"
            ? "rgba(0,128,120,0.4)"
            : "linear-gradient(135deg,#008078,#005c57)",
          color:"#fff", fontSize:"1.02rem", fontWeight:"800",
          fontFamily:"Vazirmatn,sans-serif",
          cursor: status==="loading" ? "not-allowed" : "pointer",
          transition:"all 0.3s",
          boxShadow:"0 8px 24px rgba(0,128,120,0.28)",
          letterSpacing:"0.01em",
        }}
      >
        {status==="loading" ? "در حال ارسال..." : editing ? "ثبت تغییرات" : "ثبت پاسخ دعوت‌نامه"}
      </button>
    </div>
  );
}

/* ══════════════ Map ══════════════ */
function MapSection() {
  return (
    <div style={{
      borderRadius:"16px", overflow:"hidden",
      border:"1.5px solid rgba(0,128,120,0.2)",
      boxShadow:"0 4px 20px rgba(0,128,120,0.09)",
    }}>
      <iframe
        title="موقعیت مراسم"
        width="100%"
        height="360"
        style={{ border:0, display:"block" }}
        loading="lazy"
        allowFullScreen
        src="https://maps.google.com/maps?q=35.77586,51.44194&z=17&output=embed"
      />
      <div style={{
        padding:"14px 18px", background:"#f0fdf9",
        display:"flex", justifyContent:"center",
        borderTop:"1px solid rgba(0,128,120,0.14)",
      }}>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=35.77586,51.44194"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"inline-flex", alignItems:"center", gap:"8px",
            padding:"12px 30px",
            background:"linear-gradient(135deg,#008078,#005c57)",
            color:"#fff", borderRadius:"10px",
            fontWeight:"700", fontSize:"0.95rem",
            textDecoration:"none", fontFamily:"Vazirmatn,sans-serif",
            boxShadow:"0 6px 18px rgba(0,128,120,0.32)",
          }}
        >
          مسیریابی محل مراسم ↗
        </a>
      </div>
    </div>
  );
}

/* ══════════════ App ══════════════ */
export default function GhadirRSVP() {
  const card = {
    background:"#ffffff",
    border:"1.5px solid rgba(0,128,120,0.13)",
    borderRadius:"22px", padding:"38px 32px", marginBottom:"26px",
    position:"relative", overflow:"hidden",
    boxShadow:"0 4px 28px rgba(0,128,120,0.07)",
  };
  const secTitle = { color:"#005c57", fontSize:"1.45rem", fontWeight:"800", textAlign:"center", marginBottom:"8px" };
  const divider  = {
    width:"56px", height:"2.5px",
    background:"linear-gradient(90deg,transparent,#008078,transparent)",
    margin:"0 auto 28px",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{
          font-family:'Vazirmatn',sans-serif;
          background:#f2fdfb;
          color:#1a2e2c;
          direction:rtl;
          overflow-x:hidden;
        }
        ::selection{background:rgba(0,128,120,0.2)}

        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes arrowBounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(7px);opacity:.8}}
        @keyframes glowBtn{
          0%,100%{box-shadow:0 8px 28px rgba(0,128,120,0.35)}
          50%{box-shadow:0 14px 42px rgba(0,128,120,0.55)}
        }

        .a1{animation:fadeUp .7s .05s ease both}
        .a2{animation:fadeUp .75s .2s ease both}
        .a3{animation:fadeUp .75s .35s ease both}
        .a4{animation:fadeUp .75s .5s ease both}
        .a5{animation:fadeUp .75s .65s ease both}

        /* teal shimmer for main titles */
        .teal-grad{
          background:linear-gradient(90deg,#005c57,#00a396,#005c57,#007a72);
          background-size:300% 100%;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 5s linear infinite;
        }
        /* gold shimmer for accents */
        .gold-grad{
          background:linear-gradient(90deg,#8a6200,#d4a840,#8a6200,#c49030);
          background-size:300% 100%;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 6s linear infinite;
        }

        .cta-btn{
          display:inline-block;
          background:linear-gradient(135deg,#008078,#005c57);
          border:none;padding:16px 44px;border-radius:50px;
          color:#fff;font-family:'Vazirmatn',sans-serif;
          font-size:1.08rem;font-weight:800;cursor:pointer;
          animation:glowBtn 3s ease-in-out infinite;
          transition:transform .3s;
          letter-spacing:.02em;
        }
        .cta-btn:hover{transform:translateY(-3px) scale(1.04)}

        .detail-card{
          background:#fff;
          border:1.5px solid rgba(0,128,120,0.15);
          border-radius:16px;padding:22px 14px;text-align:center;
          transition:all .3s;
          box-shadow:0 2px 12px rgba(0,128,120,0.06);
        }
        .detail-card:hover{
          transform:translateY(-5px);
          box-shadow:0 14px 32px rgba(0,128,120,0.15);
          border-color:rgba(0,128,120,0.36)
        }

        .arrow-down{animation:arrowBounce 2.4s ease-in-out infinite}
        .hero-pat{position:absolute;opacity:.07;pointer-events:none}

        input,textarea{color:#1a2e2c!important}
        input::placeholder,textarea::placeholder{color:rgba(0,80,76,.32)!important}
        input:focus,textarea:focus{
          border-color:rgba(0,128,120,0.62)!important;
          box-shadow:0 0 0 3px rgba(0,128,120,0.13)!important;
        }

        @media(max-width:680px){
          .hero-h1{font-size:1.65rem!important}
          .hero-p{font-size:.93rem!important}
          .cards-grid{grid-template-columns:1fr 1fr!important}
          .sec-pad{padding:26px 16px!important}
        }
        @media(max-width:380px){
          .cards-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ══ HERO ══ */}
      <div style={{
        /* balanced teal + warm cream gradient */
        background:"linear-gradient(145deg,#e0f7f4 0%,#f5e8c0 30%,#e8faf7 60%,#fdf3d4 100%)",
        minHeight:"100vh", position:"relative", overflow:"hidden",
      }}>
        {/* geo pattern top-right – teal */}
        <svg className="hero-pat" style={{ top:"-8%", right:"-6%", width:"44vw", maxWidth:"380px", color:"#00867e" }}
          viewBox="0 0 300 300">
          <defs>
            <pattern id="gp1" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth=".7" opacity=".65">
                <polygon points="30,4 56,17 56,43 30,56 4,43 4,17"/>
                <polygon points="30,12 50,22 50,38 30,48 10,38 10,22"/>
                <line x1="30" y1="4" x2="30" y2="56"/>
                <line x1="4"  y1="17" x2="56" y2="43"/>
                <line x1="4"  y1="43" x2="56" y2="17"/>
                <circle cx="30" cy="30" r="7"/>
              </g>
            </pattern>
          </defs>
          <rect width="300" height="300" fill="url(#gp1)"/>
        </svg>

        {/* geo pattern bottom-left – gold */}
        <svg className="hero-pat" style={{ bottom:"2%", left:"-5%", width:"38vw", maxWidth:"320px", color:"#c4a050" }}
          viewBox="0 0 300 300">
          <defs>
            <pattern id="gp2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth=".7" opacity=".65">
                <polygon points="30,4 56,17 56,43 30,56 4,43 4,17"/>
                <polygon points="30,12 50,22 50,38 30,48 10,38 10,22"/>
                <line x1="30" y1="4" x2="30" y2="56"/>
                <line x1="4"  y1="17" x2="56" y2="43"/>
                <line x1="4"  y1="43" x2="56" y2="17"/>
                <circle cx="30" cy="30" r="7"/>
              </g>
            </pattern>
          </defs>
          <rect width="300" height="300" fill="url(#gp2)"/>
        </svg>

        {/* Bismillah */}
        <div className="a1" style={{ textAlign:"center", padding:"36px 20px 10px" }}>
          <p style={{ fontSize:"1.28rem", color:"#005c57", fontWeight:"900", letterSpacing:".07em", marginBottom:"7px" }}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِیمِ
          </p>
          <p style={{ fontSize:".82rem", color:"#8a6200", letterSpacing:".04em", lineHeight:1.8, fontWeight:"600" }}>
            اَلْمُسْتَغَاثُ بِکَ یَا صَاحِبَ الزَّمَانِ اَرْوَاحُنَا فِدَاکَ
          </p>
          <div style={{ width:"100%", height:"1px", background:"linear-gradient(90deg,transparent,rgba(0,128,120,.3),rgba(196,160,80,.3),transparent)", marginTop:"18px" }}/>
        </div>

        {/* Hero body */}
        <div style={{ maxWidth:"860px", margin:"0 auto", padding:"42px 24px 62px", textAlign:"center", position:"relative" }}>

          {/* ornament line – alternating teal/gold dots */}
          <div className="a1" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", marginBottom:"22px" }}>
            <div style={{ flex:1, maxWidth:"100px", height:"1px", background:"linear-gradient(90deg,transparent,#008078)" }}/>
            <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#008078" }}/>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#c4a050" }}/>
            <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#008078" }}/>
            <div style={{ flex:1, maxWidth:"100px", height:"1px", background:"linear-gradient(90deg,#008078,transparent)" }}/>
          </div>

          <h1 className="a2 hero-h1" style={{ fontSize:"2.45rem", fontWeight:"900", lineHeight:1.45, marginBottom:"14px" }}>
            <span className="teal-grad">دعوت‌نامه جشن عید سعید</span><br/>
            <span style={{ color:"#5a4000" }} className="gold-grad">غدیر خم</span>
          </h1>

          <p className="a3 hero-p" style={{ fontSize:"1rem", color:"#2a4a46", lineHeight:2.1, maxWidth:"600px", margin:"0 auto 34px" }}>
            به مناسبت بزرگترین عید مسلمانان،<br/>
            با کمال افتخار شما را به مراسم گرامیداشت<br/>
            <strong style={{ color:"#005c57" }}>عید بزرگ ولایت</strong> دعوت می‌نماییم.
          </p>

          <div className="a4" style={{ marginBottom:"40px" }}>
            <p style={{ color:"#8a6200", fontSize:".8rem", marginBottom:"13px", letterSpacing:".04em" }}>
              زمان باقی‌مانده تا مراسم
            </p>
            <Countdown/>
          </div>

          <div className="a5">
            <button className="cta-btn" onClick={()=>document.getElementById("rsvp")?.scrollIntoView({behavior:"smooth"})}>
              ثبت حضور در مراسم
            </button>
          </div>

          <div className="arrow-down" style={{ marginTop:"48px", color:"rgba(0,128,120,.45)", fontSize:"1.5rem" }}>↓</div>
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div style={{ background:"#f2fdfb", maxWidth:"860px", margin:"0 auto", padding:"38px 20px 80px" }}>

        {/* Details */}
        <div style={card} className="sec-pad">
          <h2 style={secTitle}>جزئیات مراسم</h2>
          <div style={divider}/>
          <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"13px" }}>
            {[
              { icon:"📅", title:"تاریخ",     main:"چهارشنبه",        sub:"۲۰ خرداد ۱۴۰۵",            gold:false },
              { icon:"🕓", title:"ساعت",      main:"۱۶:۳۰",          sub:"تا حدود ۱۹:۳۰",             gold:false },
              { icon:"📍", title:"مکان",      main:"خ. شهید کلاهدوز", sub:"ک. صراف، بن‌بست ارغوان، پ. ۶", gold:false },
              { icon:"🎭", title:"برنامه‌ها", main:"اسکیپ باکس",      sub:"وقف تاریکی\nبه آریا کمک کن!", gold:true },
            ].map(c => (
              <div key={c.title} className="detail-card">
                <div style={{ fontSize:"1.7rem", marginBottom:"10px" }}>{c.icon}</div>
                <h3 style={{ color: c.gold ? "#8a6200" : "#005c57", fontSize:".88rem", marginBottom:"8px", fontWeight:"800" }}>{c.title}</h3>
                <p style={{ color:"#1a2e2c", fontSize:".87rem", fontWeight:"700", lineHeight:1.6 }}>{c.main}</p>
                <p style={{ color: c.gold ? "#a07840" : "#00867e", fontSize:".76rem", lineHeight:1.75, marginTop:"5px", whiteSpace:"pre-line" }}>{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RSVP */}
        <div id="rsvp" style={card} className="sec-pad">
          <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at top center,rgba(0,128,120,0.05) 0%,transparent 65%)", pointerEvents:"none" }}/>
          <h2 style={secTitle}>ثبت پاسخ دعوت‌نامه</h2>
          <div style={divider}/>
          <p style={{ textAlign:"center", color:"#00867e", marginBottom:"26px", fontSize:".87rem", lineHeight:1.9 }}>
            لطفاً پاسخ حضور یا عدم حضور خود را ثبت نمایید.<br/>
            این کار برای آمادگی بهتر برگزارکنندگان بسیار کمک‌کننده است.
          </p>
          <RSVPForm/>
        </div>

        {/* Map */}
        <div style={card} className="sec-pad">
          <h2 style={secTitle}>موقعیت مکانی</h2>
          <div style={divider}/>
          <p style={{ textAlign:"center", color:"#00867e", marginBottom:"18px", fontSize:".87rem", lineHeight:1.85 }}>
            تهران، خیابان شهید کلاهدوز، کوچه صراف، بن‌بست ارغوان، پلاک ۶
          </p>
          <MapSection/>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign:"center", padding:"34px 24px",
        borderTop:"1px solid rgba(0,128,120,0.18)",
        background:"linear-gradient(135deg,#e0f7f4,#f5e8c0)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", marginBottom:"16px" }}>
          <div style={{ flex:1, maxWidth:"80px", height:"1px", background:"linear-gradient(90deg,transparent,#008078)" }}/>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#c4a050", opacity:.85 }}/>
          <div style={{ flex:1, maxWidth:"80px", height:"1px", background:"linear-gradient(90deg,#008078,transparent)" }}/>
        </div>
        <p className="teal-grad" style={{ fontSize:"1rem", fontWeight:"800", marginBottom:"10px" }}>
          عید سعید غدیر خم مبارک باد
        </p>
        <p style={{ color:"#7a5500", fontSize:".82rem", lineHeight:2 }}>
          اللهم صلِّ علی محمد وآل محمد وعجِّل فرجهم والعن اعدائهم اجمعین
        </p>
      </footer>
    </>
  );
}
