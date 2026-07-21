import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  Plus, Home, FileText, Sparkles, Trash2, MessageSquare, Activity, Hand,
  GraduationCap, TrendingUp, Loader2, Award, Target, HelpCircle, Inbox,
  ClipboardList, Camera, Type, Check, X, Flag, Share2, Copy, Printer,
  ChevronRight, ImageIcon, AlertTriangle, Baby, ExternalLink, Hexagon,
  Stethoscope, HeartPulse, BookOpen, Download, Upload, Bot, Send,
} from "lucide-react";

/* ---------- design tokens ---------- */
const INK = "#17313A", SUB = "#5B7078", PAPER = "#F7F6F1", CARD = "#FFFFFF",
  LINE = "#E4E7E1", ACCENT = "#0E8577";

const DISCIPLINES = {
  "Speech Therapy": { short: "Speech", color: "#4F46E5", Icon: MessageSquare },
  "ABA": { short: "ABA", color: "#0EA5E9", Icon: Activity },
  "Occupational Therapy": { short: "OT", color: "#E8843C", Icon: Hand },
  "SPED Teacher": { short: "SPED", color: "#10B981", Icon: GraduationCap },
  "Class Teacher": { short: "Teacher", color: "#B45309", Icon: BookOpen },
  "Developmental Pediatrician": { short: "Dev Pedia", color: "#8B5CF6", Icon: HeartPulse },
  "Pediatrician": { short: "Pedia", color: "#DB2777", Icon: Stethoscope },
};
const DISC_KEYS = Object.keys(DISCIPLINES);
const DOMAINS = [
  "Communication & Language", "Social & Emotional", "Behavior & Attention",
  "Fine Motor", "Gross Motor", "Sensory Processing",
  "Daily Living / Self-Care", "Play & Pre-Academic",
];
const DOMAIN_SHORT = {
  "Communication & Language": "Language", "Social & Emotional": "Social",
  "Behavior & Attention": "Behavior", "Fine Motor": "Fine motor",
  "Gross Motor": "Gross motor", "Sensory Processing": "Sensory",
  "Daily Living / Self-Care": "Self-care", "Play & Pre-Academic": "Play",
};
const LEVELS = [
  { v: 1, label: "Emerging", color: "#D97757" },
  { v: 2, label: "Developing", color: "#E0A34E" },
  { v: 3, label: "Progressing", color: "#C9B94A" },
  { v: 4, label: "Mostly independent", color: "#6FB05A" },
  { v: 5, label: "Mastered", color: "#0E8577" },
];
const levelInfo = (v) => LEVELS.find((l) => l.v === v) || LEVELS[0];

/* ---------- developmental reference (CDC Learn the Signs, Act Early 2022) ---------- */
const CDC_MILESTONES = [
  { m: 6, label: "6 months",
    se: ["Knows familiar people", "Likes to look at self in a mirror", "Laughs"],
    lc: ["Takes turns making sounds with you", "Blows \u201craspberries\u201d", "Makes squealing noises"],
    cog: ["Puts things in her mouth to explore them", "Reaches to grab a toy she wants", "Closes lips to show she doesn't want more food"],
    mv: ["Rolls from tummy to back", "Pushes up with straight arms when on tummy", "Leans on hands to support himself when sitting"] },
  { m: 9, label: "9 months",
    se: ["Is shy, clingy, or fearful around strangers", "Shows several facial expressions, like happy, sad, angry, and surprised", "Looks when you call her name", "Reacts when you leave (looks, reaches for you, or cries)", "Smiles or laughs when you play peek-a-boo"],
    lc: ["Makes different sounds, like \u201cmamamama\u201d and \u201cbabababa\u201d", "Lifts arms up to be picked up"],
    cog: ["Looks for objects when dropped out of sight, like his spoon or toy", "Bangs two things together"],
    mv: ["Gets to a sitting position by herself", "Moves things from one hand to her other hand", "Uses fingers to \u201crake\u201d food towards himself", "Sits without support"] },
  { m: 12, label: "1 year",
    se: ["Plays games with you, like pat-a-cake"],
    lc: ["Waves \u201cbye-bye\u201d", "Calls a parent \u201cmama\u201d or \u201cdada\u201d or another special name", "Understands \u201cno\u201d (pauses briefly or stops when you say it)"],
    cog: ["Puts something in a container, like a block in a cup", "Looks for things he sees you hide, like a toy under a blanket"],
    mv: ["Pulls up to stand", "Walks, holding on to furniture", "Drinks from a cup without a lid, as you hold it", "Picks things up between thumb and pointer finger, like small bits of food"] },
  { m: 15, label: "15 months",
    se: ["Copies other children while playing, like taking toys out of a container when another child does", "Shows you an object she likes", "Claps when excited", "Hugs stuffed doll or other toy", "Shows you affection (hugs, cuddles, or kisses you)"],
    lc: ["Tries to say one or two words besides \u201cmama\u201d or \u201cdada,\u201d like \u201cba\u201d for ball or \u201cda\u201d for dog", "Looks at a familiar object when you name it", "Follows directions given with both a gesture and words", "Points to ask for something or to get help"],
    cog: ["Tries to use things the right way, like a phone, cup, or book", "Stacks at least two small objects, like blocks"],
    mv: ["Takes a few steps on his own", "Uses fingers to feed herself some food"] },
  { m: 18, label: "18 months",
    se: ["Moves away from you, but looks to make sure you are close by", "Points to show you something interesting", "Puts hands out for you to wash them", "Looks at a few pages in a book with you", "Helps you dress him by pushing arm through sleeve or lifting up foot"],
    lc: ["Tries to say three or more words besides \u201cmama\u201d or \u201cdada\u201d", "Follows one-step directions without any gestures, like giving you the toy when you say, \u201cGive it to me.\u201d"],
    cog: ["Copies you doing chores, like sweeping with a broom", "Plays with toys in a simple way, like pushing a toy car"],
    mv: ["Walks without holding on to anyone or anything", "Scribbles", "Drinks from a cup without a lid and may spill sometimes", "Feeds herself with her fingers", "Tries to use a spoon", "Climbs on and off a couch or chair without help"] },
  { m: 24, label: "2 years",
    se: ["Notices when others are hurt or upset, like pausing or looking sad when someone is crying", "Looks at your face to see how to react in a new situation"],
    lc: ["Points to things in a book when you ask, like \u201cWhere is the bear?\u201d", "Says at least two words together, like \u201cMore milk.\u201d", "Points to at least two body parts when you ask him to show you", "Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes"],
    cog: ["Holds something in one hand while using the other, like holding a container and taking the lid off", "Tries to use switches, knobs, or buttons on a toy", "Plays with more than one toy at the same time, like putting toy food on a toy plate"],
    mv: ["Kicks a ball", "Runs", "Walks (not climbs) up a few stairs with or without help", "Eats with a spoon"] },
  { m: 30, label: "30 months",
    se: ["Plays next to other children and sometimes plays with them", "Shows you what she can do by saying, \u201cLook at me!\u201d", "Follows simple routines when told, like helping to pick up toys when you say, \u201cIt's clean-up time.\u201d"],
    lc: ["Says about 50 words", "Says two or more words together, with one action word, like \u201cDoggie run\u201d", "Names things in a book when you point and ask, \u201cWhat is this?\u201d", "Says words like \u201cI,\u201d \u201cme,\u201d or \u201cwe\u201d"],
    cog: ["Uses things to pretend, like feeding a block to a doll as if it were food", "Shows simple problem-solving skills, like standing on a small stool to reach something", "Follows two-step instructions, like \u201cPut the toy down and close the door.\u201d", "Shows he knows at least one color, like pointing to a red crayon when asked"],
    mv: ["Uses hands to twist things, like turning doorknobs or unscrewing lids", "Takes some clothes off by himself, like loose pants or an open jacket", "Jumps off the ground with both feet", "Turns book pages, one at a time, when you read to her"] },
  { m: 36, label: "3 years",
    se: ["Calms down within 10 minutes after you leave her, like at a childcare drop off", "Notices other children and joins them to play"],
    lc: ["Talks with you in conversation using at least two back-and-forth exchanges", "Asks \u201cwho,\u201d \u201cwhat,\u201d \u201cwhere,\u201d or \u201cwhy\u201d questions, like \u201cWhere is mommy/daddy?\u201d", "Says what action is happening in a picture or book when asked, like \u201crunning,\u201d \u201ceating,\u201d or \u201cplaying\u201d", "Says first name, when asked", "Talks well enough for others to understand, most of the time"],
    cog: ["Draws a circle, when you show him how", "Avoids touching hot objects, like a stove, when you warn her"],
    mv: ["Strings items together, like large beads or macaroni", "Puts on some clothes by himself, like loose pants or a jacket", "Uses a fork"] },
  { m: 48, label: "4 years",
    se: ["Pretends to be something else during play (teacher, superhero, dog)", "Asks to go play with children if none are around, like \u201cCan I play with Alex?\u201d", "Comforts others who are hurt or sad, like hugging a crying friend", "Avoids danger, like not jumping from tall heights at the playground", "Likes to be a \u201chelper\u201d", "Changes behavior based on where she is (place of worship, library, playground)"],
    lc: ["Says sentences with four or more words", "Says some words from a song, story, or nursery rhyme", "Talks about at least one thing that happened during her day, like \u201cI played soccer.\u201d", "Answers simple questions, like \u201cWhat is a coat for?\u201d or \u201cWhat is a crayon for?\u201d"],
    cog: ["Names a few colors of items", "Tells what comes next in a well-known story", "Draws a person with three or more body parts"],
    mv: ["Catches a large ball most of the time", "Serves herself food or pours water, with adult supervision", "Unbuttons some buttons", "Holds crayon or pencil between fingers and thumb (not a fist)"] },
  { m: 60, label: "5 years",
    se: ["Follows rules or takes turns when playing games with other children", "Sings, dances, or acts for you", "Does simple chores at home, like matching socks or clearing the table after eating"],
    lc: ["Tells a story she heard or made up with at least two events", "Answers simple questions about a book or story after you read or tell it to her", "Keeps a conversation going with more than three back-and-forth exchanges", "Uses or recognizes simple rhymes (bat-cat, ball-tall)"],
    cog: ["Counts to 10", "Names some numbers between 1 and 5 when you point to them", "Uses words about time, like \u201cyesterday,\u201d \u201ctomorrow,\u201d \u201cmorning,\u201d or \u201cnight\u201d", "Pays attention for 5 to 10 minutes during activities (screen time doesn't count)", "Writes some letters in her name", "Names some letters when you point to them"],
    mv: ["Buttons some buttons", "Hops on one foot"] },
];
const GROWTH_GUIDES = [
  { key: "g68", label: "6\u20138 years",
    social: ["Shows more independence from parents and family", "Starts to think about the future", "Understands more about their place in the world", "Pays more attention to friendships and teamwork", "Wants to be liked and accepted by friends"],
    thinking: ["Shows rapid growth of mental skills", "Learns better ways to describe experiences and talk about thoughts and feelings", "Has less focus on themselves and more concern for others"] },
  { key: "g911", label: "9\u201311 years",
    social: ["Starts to form stronger, more complex friendships and peer relationships", "Feels more peer pressure", "Becomes more aware of their body as puberty approaches"],
    thinking: ["Faces more academic challenges at school", "Becomes more independent from the family", "Begins to see other people's points of view more clearly", "Has a longer attention span"] },
  { key: "g1214", label: "12\u201314 years",
    social: ["Shows more concern about body image, looks, and clothes", "Moves between high expectations and low confidence", "Has more moodiness", "Is more influenced by the peer group", "Shows less affection toward parents, and can be short-tempered at times"],
    thinking: ["Is more able to think through complex problems", "Can express feelings better through talking", "Develops a stronger sense of right and wrong"] },
];
function pickBand(months) {
  if (months >= 144) return "g1214";
  if (months >= 108) return "g911";
  if (months >= 72) return "g68";
  for (const m of [60, 48, 36, 30, 24, 18, 15, 12, 9, 6]) if (months >= m) return "m" + m;
  return "m6";
}

/* ---------- storage (on-device IndexedDB — data never leaves this browser) ---------- */
const idb = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open("ndt", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction("kv", mode), s = t.objectStore("kv"), q = fn(s);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  };
  return {
    get: (k) => tx("readonly", (s) => s.get(k)),
    set: (k, v) => tx("readwrite", (s) => s.put(v, k)),
    del: (k) => tx("readwrite", (s) => s.delete(k)),
  };
})();
const store = {
  async get(k, fb) { try { const v = await idb.get(k); return v === undefined ? fb : JSON.parse(v); } catch { return fb; } },
  async set(k, v) { try { await idb.set(k, JSON.stringify(v)); } catch {} },
  async del(k) { try { await idb.del(k); } catch {} },
};
const imgKey = (id) => `ndt:scan:${id}`;

/* ---------- utils ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => d.slice(0, 7);
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtMonth = (m) => new Date(m + "-01T00:00:00").toLocaleDateString(undefined, { month: "short", year: "2-digit" });
function ageFrom(dob) {
  if (!dob) return "";
  const b = new Date(dob + "T00:00:00"), n = new Date();
  let mo = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  if (n.getDate() < b.getDate()) mo -= 1;
  if (mo < 0) return "";
  return `${Math.floor(mo / 12)}y ${mo % 12}m`;
}
function fileToJpeg(file, max = 1100, q = 0.62) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (Math.max(w, h) > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", q));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
const fileToDataUrl = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
const strip = (dataUrl) => dataUrl.split(",")[1];

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); return true; }
    catch { return false; }
  }
}

/* ---------- Claude calls (via our serverless proxy — API key stays on the server) ---------- */
async function claudeJSON(content, maxTokens = 1600) {
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error("proxy " + res.status);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
async function claudeText(content, maxTokens = 1200) {
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error("proxy " + res.status);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ---------- sample data ---------- */
function sampleNotes() {
  const base = new Date();
  const d = (n) => { const x = new Date(base); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const rows = [
    [70, "Speech Therapy", "Ms. Ramos", "Communication & Language", "Requesting with words", 1, "Used mostly gestures. Introduced picture exchange for 'more' and 'juice'."],
    [56, "ABA", "Coach Dan", "Behavior & Attention", "Sitting for table time", 2, "Tolerated 3-min table time with a reinforcer. Fewer escape behaviors."],
    [49, "Occupational Therapy", "Ms. Cruz", "Fine Motor", "Grasping crayon", 2, "Palmar grasp on chunky crayon. Vertical strokes hand-over-hand."],
    [42, "SPED Teacher", "Teacher Lyn", "Play & Pre-Academic", "Matching colors", 2, "Matched red and blue with prompts. Attends ~2 minutes."],
    [35, "Speech Therapy", "Ms. Ramos", "Communication & Language", "Requesting with words", 3, "Said 'more' twice at snack. Approximates 'juice'."],
    [28, "ABA", "Coach Dan", "Social & Emotional", "Responding to name", 3, "Turned to name 6/10 trials. Brief eye contact when greeted."],
    [21, "Occupational Therapy", "Ms. Cruz", "Sensory Processing", "Tolerating textures", 2, "Explored kinetic sand 4 min. Hesitant then engaged."],
    [12, "Speech Therapy", "Ms. Ramos", "Communication & Language", "Two-word phrases", 3, "Combined 'more juice' with a model."],
    [7, "ABA", "Coach Dan", "Behavior & Attention", "Sitting for table time", 4, "8-min table time, mostly independent."],
    [2, "SPED Teacher", "Teacher Lyn", "Daily Living / Self-Care", "Handwashing steps", 2, "Followed 2 of 4 steps with a visual schedule."],
  ];
  return rows.map(([n, discipline, therapist, domain, skill, progress, content]) => ({
    id: uid(), date: d(n), discipline, therapist, domain, skill, progress, content, source: "typed",
  }));
}

/* ================================================================= */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recs, setRecs] = useState([]);
  const [profile, setProfile] = useState({ name: "", dob: "" });
  const [assessment, setAssessment] = useState(null);
  const [milestones, setMilestones] = useState({});
  const [chat, setChat] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { (async () => {
    setNotes(await store.get("ndt:notes", []));
    setGoals(await store.get("ndt:goals", []));
    setRecs(await store.get("ndt:recs", []));
    setProfile(await store.get("ndt:profile", { name: "", dob: "" }));
    setAssessment(await store.get("ndt:assessment", null));
    setMilestones(await store.get("ndt:milestones", {}));
    setChat(await store.get("ndt:chat", []));
    setLoaded(true);
  })(); }, []);

  const saveNotes = (n) => { setNotes(n); store.set("ndt:notes", n); };
  const saveGoals = (g) => { setGoals(g); store.set("ndt:goals", g); };
  const saveRecs = (r) => { setRecs(r); store.set("ndt:recs", r); };
  const saveProfile = (p) => { setProfile(p); store.set("ndt:profile", p); };
  const saveAssessment = (a) => { setAssessment(a); store.set("ndt:assessment", a); };
  const saveMilestones = (m) => { setMilestones(m); store.set("ndt:milestones", m); };
  const saveChat = (c) => { setChat(c); store.set("ndt:chat", c); };

  const addNote = async (n, imageDataUrl) => {
    const id = uid();
    if (imageDataUrl) await store.set(imgKey(id), imageDataUrl);
    saveNotes([{ ...n, id }, ...notes]);
  };
  const deleteNote = (id) => { store.del(imgKey(id)); saveNotes(notes.filter((x) => x.id !== id)); };

  const exportAll = async () => {
    const images = {};
    for (const n of notes) if (n.source === "scan") { const img = await store.get(imgKey(n.id), null); if (img) images[n.id] = img; }
    const payload = { app: "dev-tracker", version: 1, exportedAt: new Date().toISOString(), data: { notes, goals, recs, profile, assessment, milestones, chat }, images };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dev-tracker-backup-${todayStr()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const importAll = async (file) => {
    try {
      const p = JSON.parse(await file.text());
      if (p.app !== "dev-tracker" || !p.data) throw new Error("bad file");
      const d = p.data;
      const nn = Array.isArray(d.notes) ? d.notes : [];
      saveNotes(nn);
      saveGoals(Array.isArray(d.goals) ? d.goals : []);
      saveRecs(Array.isArray(d.recs) ? d.recs : []);
      saveProfile(d.profile && typeof d.profile === "object" ? d.profile : { name: "", dob: "" });
      saveAssessment(d.assessment || null);
      saveMilestones(d.milestones && typeof d.milestones === "object" ? d.milestones : {});
      saveChat(Array.isArray(d.chat) ? d.chat : []);
      if (p.images) for (const [id, img] of Object.entries(p.images)) await store.set(imgKey(id), img);
      return nn.length;
    } catch { return -1; }
  };

  if (!loaded)
    return <div style={{ background: PAPER }} className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" style={{ color: ACCENT }} size={28} /></div>;

  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen">
      <style>{`
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
        .tabbtn:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px;border-radius:10px}
        @media print{ body *{visibility:hidden} #handout,#handout *{visibility:visible} #handout{position:absolute;left:0;top:0;width:100%} .no-print{display:none!important} }
      `}</style>

      <Header profile={profile} onSave={saveProfile} count={notes.length} onExport={exportAll} onImport={importAll} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Nav tab={tab} setTab={setTab} />
        <main className="pb-24 pt-6">
          {tab === "dashboard" && <Dashboard notes={notes} goals={goals} setTab={setTab} onSample={() => saveNotes(sampleNotes())} />}
          {tab === "log" && <NotesLog notes={notes} goals={goals} onDelete={deleteNote} setTab={setTab} />}
          {tab === "add" && <AddNote goals={goals} onAdd={async (n, img) => { await addNote(n, img); setTab("log"); }} />}
          {tab === "goals" && <Goals goals={goals} notes={notes} onSave={saveGoals} />}
          {tab === "milestones" && <Milestones profile={profile} status={milestones} onSave={saveMilestones} />}
          {tab === "assessment" && <Assessment notes={notes} profile={profile} saved={assessment} onSave={saveAssessment} />}
          {tab === "activities" && <Activities notes={notes} goals={goals} profile={profile} recs={recs} onSave={saveRecs} />}
          {tab === "ask" && <AskPanel notes={notes} profile={profile} chat={chat} onSave={saveChat} />}
        </main>
      </div>
    </div>
  );
}

/* ---------- header + nav ---------- */
function Header({ profile, onSave, count, onExport, onImport }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const fileRef = useRef();
  const [msg, setMsg] = useState("");
  useEffect(() => setDraft(profile), [profile]);
  const initial = (profile.name || "?").trim().charAt(0).toUpperCase() || "?";
  const age = ageFrom(profile.dob);
  return (
    <header style={{ background: CARD, borderBottom: `1px solid ${LINE}` }} className="no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white text-lg font-semibold shrink-0" style={{ background: ACCENT }}>{initial}</div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl sm:text-2xl leading-tight truncate">{profile.name ? `${profile.name}'s Progress` : "My Child's Progress"}</h1>
          <p className="text-xs sm:text-sm" style={{ color: SUB }}>{age ? `${age} · ` : ""}{count} note{count === 1 ? "" : "s"} across the care team</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-sm px-3 py-1.5 rounded-lg tabbtn" style={{ color: ACCENT, border: `1px solid ${LINE}` }}>{profile.name ? "Edit" : "Set up"}</button>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${LINE}`, background: PAPER }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-3 items-end">
            <Field label="Child's name or nickname" className="flex-1 min-w-[180px]">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Sam" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} />
            </Field>
            <Field label="Date of birth" className="min-w-[150px]">
              <input type="date" value={draft.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} />
            </Field>
            <button onClick={() => { onSave(draft); setOpen(false); }} className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ background: ACCENT }}>Save</button>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 flex flex-wrap gap-2 items-center">
            <button onClick={onExport} className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ color: ACCENT, border: `1px solid ${LINE}`, background: CARD }}><Download size={13} /> Backup data</button>
            <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ color: ACCENT, border: `1px solid ${LINE}`, background: CARD }}><Upload size={13} /> Restore backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; if (!window.confirm("Restoring replaces ALL current data in this app with the backup. Continue?")) return; const n = await onImport(f); setMsg(n < 0 ? "Couldn't read that backup file." : `Restored ${n} note${n === 1 ? "" : "s"}.`); }} />
            {msg && <span className="text-xs font-medium" style={{ color: ACCENT }}>{msg}</span>}
            <span className="text-[11px] w-full" style={{ color: SUB }}>Data lives only in this browser. Download a backup regularly — it includes notes, scans, goals, milestones, and settings.</span>
          </div>
        </div>
      )}
    </header>
  );
}
function Nav({ tab, setTab }) {
  const items = [
    { k: "dashboard", label: "Dashboard", Icon: Home },
    { k: "log", label: "Notes", Icon: FileText },
    { k: "add", label: "Add", Icon: Plus },
    { k: "goals", label: "Goals", Icon: Flag },
    { k: "milestones", label: "Milestones", Icon: Baby },
    { k: "assessment", label: "Assessment", Icon: Sparkles },
    { k: "activities", label: "Activities", Icon: Target },
    { k: "ask", label: "Ask", Icon: Bot },
  ];
  return (
    <nav className="flex gap-1 sm:gap-2 mt-4 overflow-x-auto no-print">
      {items.map(({ k, label, Icon }) => {
        const active = tab === k;
        return (
          <button key={k} onClick={() => setTab(k)} className="tabbtn flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm whitespace-nowrap"
            style={{ background: active ? INK : CARD, color: active ? "#fff" : SUB, border: `1px solid ${active ? INK : LINE}`, fontWeight: active ? 600 : 500 }}>
            <Icon size={16} /> {label}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- shared pieces ---------- */
function Field({ label, children, className = "" }) {
  return <label className={`block ${className}`}><span className="block text-xs mb-1 font-medium" style={{ color: SUB }}>{label}</span>{children}</label>;
}
function Chip({ discipline }) {
  const d = DISCIPLINES[discipline]; if (!d) return null;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: d.color + "18", color: d.color }}><d.Icon size={12} /> {d.short}</span>;
}
function LevelPill({ v }) {
  const l = levelInfo(v);
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: l.color }}><span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}</span>;
}
function Card({ children, className = "", style = {}, id }) {
  return <div id={id} className={`rounded-2xl p-4 sm:p-5 ${className}`} style={{ background: CARD, border: `1px solid ${LINE}`, ...style }}>{children}</div>;
}
function Empty({ title, body, children }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: ACCENT + "14" }}><Inbox size={26} style={{ color: ACCENT }} /></div>
      <h3 className="font-serif text-xl mb-1">{title}</h3>
      <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: SUB }}>{body}</p>
      {children}
    </div>
  );
}
function NoteImage({ noteId }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { let on = true; store.get(imgKey(noteId), null).then((v) => on && setSrc(v)); return () => { on = false; }; }, [noteId]);
  if (!src) return null;
  return <img src={src} alt="Scanned note" className="mt-3 rounded-xl max-h-64 w-auto" style={{ border: `1px solid ${LINE}` }} />;
}

/* ---------- goal helpers ---------- */
function goalStats(goal, notes) {
  const linked = notes.filter((n) => n.goalId === goal.id).sort((a, b) => a.date.localeCompare(b.date));
  const current = linked.length ? linked[linked.length - 1].progress : null;
  return { linked, current };
}

/* ---------- dashboard ---------- */
function Dashboard({ notes, goals, setTab, onSample }) {
  if (notes.length === 0)
    return (
      <Empty title="Start your child's record" body="Add notes from each session — type them or scan the teacher's copy — and the picture builds itself.">
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => setTab("add")} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: ACCENT }}>Add first note</button>
          <button onClick={onSample} className="px-4 py-2 rounded-lg text-sm" style={{ color: ACCENT, border: `1px solid ${LINE}`, background: CARD }}>Load sample data</button>
        </div>
      </Empty>
    );

  const trend = useMemo(() => {
    const bm = {};
    notes.forEach((n) => (bm[monthKey(n.date)] = bm[monthKey(n.date)] || []).push(n.progress));
    return Object.keys(bm).sort().map((m) => ({ month: fmtMonth(m), avg: +(bm[m].reduce((a, b) => a + b, 0) / bm[m].length).toFixed(2) }));
  }, [notes]);

  const byDomain = useMemo(() => {
    const map = {};
    notes.forEach((n) => (map[n.domain] = map[n.domain] || []).push(n));
    return DOMAINS.filter((d) => map[d]).map((d) => {
      const arr = map[d].slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
      return { domain: d, avg: +(arr.reduce((a, b) => a + b.progress, 0) / arr.length).toFixed(2), count: map[d].length };
    }).sort((a, b) => b.avg - a.avg);
  }, [notes]);

  const radarData = useMemo(() => {
    const map = {};
    notes.forEach((n) => (map[n.domain] = map[n.domain] || []).push(n));
    return DOMAINS.map((d) => {
      const arr = (map[d] || []).slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
      return { domain: DOMAIN_SHORT[d], value: arr.length ? +(arr.reduce((a, b) => a + b.progress, 0) / arr.length).toFixed(2) : 0 };
    });
  }, [notes]);

  const perDisc = DISC_KEYS.map((k) => ({ k, count: notes.filter((n) => n.discipline === k).length }));
  const activeGoals = goals.filter((g) => g.status !== "achieved").slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {perDisc.map(({ k, count }) => {
          const d = DISCIPLINES[k];
          return (
            <Card key={k} className="!p-3 sm:!p-4">
              <div className="flex items-center gap-2 mb-1.5"><span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: d.color + "18" }}><d.Icon size={15} style={{ color: d.color }} /></span><span className="text-xs" style={{ color: SUB }}>{d.short}</span></div>
              <div className="text-2xl font-serif">{count}</div>
              <div className="text-[11px]" style={{ color: SUB }}>session note{count === 1 ? "" : "s"}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="font-serif text-lg mb-1 flex items-center gap-2"><Hexagon size={18} style={{ color: ACCENT }} /> Developmental profile</h2>
        <p className="text-xs mb-2" style={{ color: SUB }}>Current level across all eight areas, at a glance (recent 3 notes each).</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%" margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
              <PolarGrid stroke={LINE} />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: SUB }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={ACCENT} strokeWidth={2} fill={ACCENT} fillOpacity={0.22} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }} formatter={(v) => [v ? `${v} · ${levelInfo(Math.round(v) || 1).label}` : "No notes yet", "Level"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {activeGoals.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg flex items-center gap-2"><Flag size={18} style={{ color: ACCENT }} /> Active goals</h2>
            <button onClick={() => setTab("goals")} className="text-xs flex items-center gap-1" style={{ color: ACCENT }}>Manage <ChevronRight size={13} /></button>
          </div>
          <div className="space-y-3">
            {activeGoals.map((g) => {
              const { current } = goalStats(g, notes);
              const lvl = current ? levelInfo(current) : null;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1"><span>{g.name}</span><span className="text-xs" style={{ color: SUB }}>{lvl ? lvl.label : "No notes yet"}</span></div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: LINE }}><div className="h-full rounded-full" style={{ width: `${((current || 0) / 5) * 100}%`, background: lvl ? lvl.color : LINE }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-serif text-lg mb-1 flex items-center gap-2"><TrendingUp size={18} style={{ color: ACCENT }} /> Overall progress trend</h2>
        <p className="text-xs mb-3" style={{ color: SUB }}>Average progress level across all sessions, month by month.</p>
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: SUB }} axisLine={{ stroke: LINE }} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: SUB }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }} formatter={(v) => [`${v} · ${levelInfo(Math.round(v)).label}`, "Avg level"]} />
              <Line type="monotone" dataKey="avg" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 4, fill: ACCENT }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="font-serif text-lg mb-1">Where things stand, by area</h2>
        <p className="text-xs mb-4" style={{ color: SUB }}>Average of the 3 most recent notes in each area.</p>
        <div className="space-y-3">
          {byDomain.map((r) => {
            const l = levelInfo(Math.round(r.avg));
            return (
              <div key={r.domain}>
                <div className="flex justify-between text-sm mb-1"><span>{r.domain}</span><span className="text-xs" style={{ color: SUB }}>{l.label} · {r.count} note{r.count === 1 ? "" : "s"}</span></div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: LINE }}><div className="h-full rounded-full" style={{ width: `${(r.avg / 5) * 100}%`, background: l.color }} /></div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------- notes log ---------- */
function NotesLog({ notes, goals, onDelete, setTab }) {
  const [disc, setDisc] = useState("all");
  const [dom, setDom] = useState("all");
  const [openImg, setOpenImg] = useState(null);
  const filtered = useMemo(() => notes
    .filter((n) => disc === "all" || n.discipline === disc)
    .filter((n) => dom === "all" || n.domain === dom)
    .sort((a, b) => b.date.localeCompare(a.date)), [notes, disc, dom]);

  if (notes.length === 0)
    return <Empty title="No notes yet" body="Every session note lands here, sorted by date."><button onClick={() => setTab("add")} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: ACCENT }}>Add a note</button></Empty>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={disc} onChange={(e) => setDisc(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>
          <option value="all">All therapists</option>{DISC_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={dom} onChange={(e) => setDom(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>
          <option value="all">All areas</option>{DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="ml-auto text-sm self-center" style={{ color: SUB }}>{filtered.length} shown</span>
      </div>
      <div className="space-y-3">
        {filtered.map((n) => {
          const goal = goals.find((g) => g.id === n.goalId);
          return (
            <Card key={n.id} className="!p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Chip discipline={n.discipline} />
                    <span className="text-xs" style={{ color: SUB }}>{n.therapist || "—"} · {fmtDate(n.date)}</span>
                    {n.source === "scan" && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: SUB }}><Camera size={12} /> scanned</span>}
                  </div>
                  <div className="text-sm font-medium mb-0.5">{n.domain}{n.skill ? ` — ${n.skill}` : ""}</div>
                  <p className="text-sm leading-relaxed" style={{ color: "#3C4B50" }}>{n.content}</p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <LevelPill v={n.progress} />
                    {goal && <span className="text-[11px] inline-flex items-center gap-1" style={{ color: ACCENT }}><Flag size={11} /> {goal.name}</span>}
                    {n.source === "scan" && <button onClick={() => setOpenImg(openImg === n.id ? null : n.id)} className="text-[11px] inline-flex items-center gap-1" style={{ color: SUB }}><ImageIcon size={11} /> {openImg === n.id ? "hide" : "view"} original</button>}
                  </div>
                  {openImg === n.id && <NoteImage noteId={n.id} />}
                </div>
                <button onClick={() => onDelete(n.id)} className="p-1.5 rounded-lg shrink-0" style={{ color: SUB }} aria-label="Delete note"><Trash2 size={16} /></button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- add note (type or scan) ---------- */
const OCR_PROMPT = `You are reading a photo or scan of a therapy or classroom progress note for a young child. Transcribe and structure it. Do not invent content that is not visible. If something is unreadable or uncertain, still give your best guess but list that field name in "uncertain".

Return ONLY valid JSON (no markdown), shape:
{"date":"YYYY-MM-DD or empty","provider":"person's name if written, else empty","discipline":"one of: ${DISC_KEYS.join(" | ")} | empty","domain":"closest of: ${DOMAINS.join(" | ")}","skill":"specific goal/skill if mentioned, else empty","summary":"a clean, readable transcription/summary of the note in plain sentences","progress":"integer 1-5 estimating progress (1 emerging .. 5 mastered) or null","uncertain":["field names you were unsure about"]}`;

function AddNote({ goals, onAdd }) {
  const [mode, setMode] = useState("type");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[["type", "Type it", Type], ["scan", "Scan it", Camera]].map(([k, label, Icon]) => {
          const on = mode === k;
          return <button key={k} onClick={() => setMode(k)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ background: on ? INK : CARD, color: on ? "#fff" : SUB, border: `1px solid ${on ? INK : LINE}` }}><Icon size={16} /> {label}</button>;
        })}
      </div>
      {mode === "type"
        ? <NoteForm goals={goals} onSubmit={(n) => onAdd({ ...n, source: "typed" })} />
        : <ScanIntake goals={goals} onSubmit={(n, img) => onAdd({ ...n, source: "scan" }, img)} />}
    </div>
  );
}

function NoteForm({ goals, initial, onSubmit }) {
  const [f, setF] = useState(initial || { date: todayStr(), discipline: DISC_KEYS[0], therapist: "", domain: DOMAINS[0], skill: "", content: "", progress: 3, goalId: "" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const valid = f.content.trim().length > 0;
  const activeGoals = goals.filter((g) => g.status !== "achieved");
  return (
    <>
      <Card>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Date"><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} /></Field>
          <Field label="Therapist / teacher name"><input value={f.therapist} onChange={(e) => set("therapist", e.target.value)} placeholder="e.g. Ms. Ramos" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} /></Field>
          <Field label="Who wrote this?"><select value={f.discipline} onChange={(e) => set("discipline", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>{DISC_KEYS.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Developmental area"><select value={f.domain} onChange={(e) => set("domain", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        </div>
        <Field label="Goal or skill worked on (optional)" className="mt-3"><input value={f.skill} onChange={(e) => set("skill", e.target.value)} placeholder="e.g. Requesting with words" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} /></Field>
        {activeGoals.length > 0 && (
          <Field label="Link to a tracked goal (optional)" className="mt-3">
            <select value={f.goalId} onChange={(e) => set("goalId", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>
              <option value="">Not linked</option>{activeGoals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="What happened this session" className="mt-3"><textarea value={f.content} onChange={(e) => set("content", e.target.value)} rows={4} placeholder="Copy the therapist's note, or write what you observed…" className="w-full px-3 py-2 rounded-lg text-sm leading-relaxed resize-y" style={{ border: `1px solid ${LINE}`, background: CARD }} /></Field>
        <div className="mt-4">
          <span className="block text-xs mb-2 font-medium" style={{ color: SUB }}>Progress on this skill</span>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => { const on = f.progress === l.v; return <button key={l.v} onClick={() => set("progress", l.v)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: on ? l.color : CARD, color: on ? "#fff" : l.color, border: `1px solid ${on ? l.color : LINE}` }}>{l.label}</button>; })}
          </div>
        </div>
      </Card>
      <button onClick={() => valid && onSubmit(f)} disabled={!valid} className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-40" style={{ background: ACCENT }}>Save note</button>
    </>
  );
}

function ScanIntake({ goals, onSubmit }) {
  const [phase, setPhase] = useState("pick"); // pick | reading | review | error
  const [img, setImg] = useState(null);       // stored dataURL (image) or null (pdf)
  const [extracted, setExtracted] = useState(null);
  const [uncertain, setUncertain] = useState([]);
  const [err, setErr] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setErr(""); setPhase("reading");
    try {
      const isPdf = file.type === "application/pdf";
      let content, storeImg = null;
      if (isPdf) {
        const b64 = strip(await fileToDataUrl(file));
        content = [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: OCR_PROMPT }];
      } else {
        const jpeg = await fileToJpeg(file);
        storeImg = jpeg;
        content = [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: strip(jpeg) } }, { type: "text", text: OCR_PROMPT }];
      }
      const r = await claudeJSON(content, 1500);
      setImg(storeImg);
      setUncertain(Array.isArray(r.uncertain) ? r.uncertain : []);
      setExtracted({
        date: r.date || todayStr(),
        discipline: DISC_KEYS.includes(r.discipline) ? r.discipline : DISC_KEYS[0],
        therapist: r.provider || "",
        domain: DOMAINS.includes(r.domain) ? r.domain : DOMAINS[0],
        skill: r.skill || "",
        content: r.summary || "",
        progress: [1, 2, 3, 4, 5].includes(r.progress) ? r.progress : 3,
        goalId: "",
      });
      setPhase("review");
    } catch { setErr("Couldn't read that file. Try a clearer photo, or type the note instead."); setPhase("error"); }
  };

  if (phase === "reading")
    return <Card className="text-center py-12"><Loader2 size={26} className="animate-spin mx-auto mb-3" style={{ color: ACCENT }} /><p className="text-sm" style={{ color: SUB }}>Reading the note…</p></Card>;

  if (phase === "review" && extracted)
    return (
      <div className="space-y-4">
        {img && <Card className="!p-3"><img src={img} alt="Scan" className="rounded-xl w-full max-h-72 object-contain" /></Card>}
        <div className="flex items-start gap-2 text-sm px-1" style={{ color: SUB }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "#E0A34E" }} />
          <span>Check everything before saving{uncertain.length ? `, especially: ${uncertain.join(", ")}` : ""}. Handwriting reading isn't perfect.</span>
        </div>
        <NoteForm goals={goals} initial={extracted} onSubmit={(n) => onSubmit(n, img)} />
      </div>
    );

  return (
    <Card className="text-center py-10">
      <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: ACCENT + "14" }}><Camera size={26} style={{ color: ACCENT }} /></div>
      <h3 className="font-serif text-lg mb-1">Scan the teacher's note</h3>
      <p className="text-sm max-w-xs mx-auto mb-5" style={{ color: SUB }}>Take a photo or upload a scan. It reads the note and fills in the fields for you to confirm.</p>
      {err && <p className="text-sm mb-4" style={{ color: "#C0492E" }}>{err}</p>}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <button onClick={() => inputRef.current?.click()} className="px-5 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: ACCENT }}>Choose photo or file</button>
    </Card>
  );
}

/* ---------- goals ---------- */
function Goals({ goals, notes, onSave }) {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState({ name: "", domain: DOMAINS[0], target: 5 });

  const create = () => {
    if (!draft.name.trim()) return;
    onSave([{ id: uid(), name: draft.name.trim(), domain: draft.domain, target: draft.target, status: "active", createdAt: todayStr() }, ...goals]);
    setDraft({ name: "", domain: DOMAINS[0], target: 5 }); setCreating(false);
  };
  const toggleStatus = (g) => onSave(goals.map((x) => x.id === g.id ? { ...x, status: x.status === "achieved" ? "active" : "achieved" } : x));
  const remove = (id) => { onSave(goals.filter((g) => g.id !== id)); setOpen(null); };

  const detail = open && goals.find((g) => g.id === open);
  if (detail) {
    const { linked, current } = goalStats(detail, notes);
    const data = linked.map((n) => ({ date: fmtDate(n.date), level: n.progress }));
    return (
      <div className="space-y-4">
        <button onClick={() => setOpen(null)} className="text-sm" style={{ color: ACCENT }}>← All goals</button>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl">{detail.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: SUB }}>{detail.domain} · target {levelInfo(detail.target).label}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: current == null ? SUB : current >= detail.target ? "#4E8A3E" : ACCENT }}>{current == null ? "No linked notes yet" : current >= detail.target ? "Target reached" : `${detail.target - current} level${detail.target - current > 1 ? "s" : ""} to target`}</p>
            </div>
            <div className="text-right">{current ? <LevelPill v={current} /> : <span className="text-xs" style={{ color: SUB }}>No linked notes</span>}</div>
          </div>
          {data.length > 1 && (
            <div style={{ height: 190 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: SUB }} axisLine={{ stroke: LINE }} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: SUB }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13 }} formatter={(v) => [levelInfo(v).label, "Level"]} />
                  <Line type="monotone" dataKey="level" stroke={ACCENT} strokeWidth={2.5} dot={{ r: 4, fill: ACCENT }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <div className="flex gap-2">
          <button onClick={() => toggleStatus(detail)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: detail.status === "achieved" ? CARD : ACCENT, color: detail.status === "achieved" ? ACCENT : "#fff", border: `1px solid ${detail.status === "achieved" ? LINE : ACCENT}` }}>{detail.status === "achieved" ? "Reopen goal" : "Mark achieved"}</button>
          <button onClick={() => remove(detail.id)} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: "#C0492E", border: `1px solid ${LINE}` }}>Delete</button>
        </div>
        <div>
          <p className="text-xs font-medium mb-2 px-1" style={{ color: SUB }}>Linked notes ({linked.length})</p>
          <div className="space-y-2">
            {linked.slice().reverse().map((n) => (
              <Card key={n.id} className="!p-3"><div className="flex justify-between items-center mb-1"><Chip discipline={n.discipline} /><span className="text-xs" style={{ color: SUB }}>{fmtDate(n.date)}</span></div><p className="text-sm" style={{ color: "#3C4B50" }}>{n.content}</p><div className="mt-1.5"><LevelPill v={n.progress} /></div></Card>
            ))}
            {linked.length === 0 && <p className="text-sm px-1" style={{ color: SUB }}>Link notes to this goal when adding them.</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!creating
        ? <button onClick={() => setCreating(true)} className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2" style={{ background: ACCENT }}><Plus size={17} /> New goal</button>
        : (
          <Card>
            <h3 className="font-serif text-lg mb-3">New goal</h3>
            <Field label="Goal name"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Uses 2-word phrases" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD }} /></Field>
            <Field label="Area" className="mt-3"><select value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <div className="mt-3"><span className="block text-xs mb-2 font-medium" style={{ color: SUB }}>Target level</span><div className="flex flex-wrap gap-2">{LEVELS.map((l) => { const on = draft.target === l.v; return <button key={l.v} onClick={() => setDraft({ ...draft, target: l.v })} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: on ? l.color : CARD, color: on ? "#fff" : l.color, border: `1px solid ${on ? l.color : LINE}` }}>{l.label}</button>; })}</div></div>
            <div className="flex gap-2 mt-4"><button onClick={create} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: ACCENT }}>Create goal</button><button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: SUB, border: `1px solid ${LINE}` }}>Cancel</button></div>
          </Card>
        )}

      {goals.length === 0 && !creating && <Empty title="No goals yet" body="Track a specific skill over time — link session notes to it and watch the trend." />}

      <div className="space-y-3">
        {goals.map((g) => {
          const { current, linked } = goalStats(g, notes);
          const lvl = current ? levelInfo(current) : null;
          return (
            <button key={g.id} onClick={() => setOpen(g.id)} className="w-full text-left">
              <Card className="!p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium truncate">{g.name}</span>{g.status === "achieved" && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#6FB05A22", color: "#4E8A3E" }}>achieved</span>}</div>
                    <div className="text-xs mt-0.5" style={{ color: SUB }}>{g.domain} · {linked.length} note{linked.length === 1 ? "" : "s"}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">{lvl ? <LevelPill v={current} /> : <span className="text-xs" style={{ color: SUB }}>—</span>}<ChevronRight size={16} style={{ color: SUB }} /></div>
                </div>
                <div className="relative mt-2.5">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: LINE }}><div className="h-full rounded-full" style={{ width: `${((current || 0) / 5) * 100}%`, background: lvl ? lvl.color : LINE }} /></div>
                  <div className="absolute -top-1 w-px h-4" style={{ left: `${(g.target / 5) * 100}%`, background: INK, opacity: 0.4 }} title="Target" />
                </div>
                <div className="text-[11px] mt-1.5" style={{ color: SUB }}>Target: {levelInfo(g.target).label} · {current == null ? "not started" : current >= g.target ? "reached" : `${g.target - current} to go`}</div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- milestones reference ---------- */
const MS_CATS = [["se", "Social / Emotional"], ["lc", "Language / Communication"], ["cog", "Cognitive"], ["mv", "Movement / Physical"]];
const MS_SOURCE = "https://www.cdc.gov/act-early/milestones/index.html";

function Milestones({ profile, status, onSave }) {
  const months = useMemo(() => {
    if (!profile.dob) return 36;
    const b = new Date(profile.dob + "T00:00:00"), n = new Date();
    let m = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) m -= 1;
    return Math.max(0, m);
  }, [profile.dob]);

  const bands = useMemo(() => [
    ...CDC_MILESTONES.map((b) => ({ key: "m" + b.m, label: b.label, type: "checklist", data: b })),
    ...GROWTH_GUIDES.map((g) => ({ key: g.key, label: g.label, type: "guide", data: g })),
  ], []);
  const def = pickBand(months);
  const [sel, setSel] = useState(def);
  const band = bands.find((b) => b.key === sel) || bands[0];

  return (
    <div className="space-y-4">
      <Card style={{ background: "linear-gradient(180deg,#F0F7F5,#FFFFFF)" }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: ACCENT + "1A" }}><Baby size={20} style={{ color: ACCENT }} /></span>
          <div className="flex-1">
            <h2 className="font-serif text-lg">Developmental reference</h2>
            <p className="text-sm mt-0.5" style={{ color: SUB }}>What most children do by a given age — a starting point for conversations with your team, not a pass/fail test or a diagnosis. Every child's path differs, and autistic children often reach these on their own timeline and in their own order.</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium shrink-0" style={{ color: SUB }}>Age band</span>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ border: `1px solid ${LINE}`, background: CARD, color: INK }}>
          <optgroup label="CDC milestones (through age 5)">
            {bands.filter((b) => b.type === "checklist").map((b) => <option key={b.key} value={b.key}>{b.label}{b.key === def ? " · closest to your child" : ""}</option>)}
          </optgroup>
          <optgroup label="General guide (6–14 years)">
            {bands.filter((b) => b.type === "guide").map((b) => <option key={b.key} value={b.key}>{b.label}{b.key === def ? " · closest to your child" : ""}</option>)}
          </optgroup>
        </select>
      </div>

      {band.type === "checklist" ? <MsChecklist band={band} status={status} onSave={onSave} sel={sel} /> : <MsGuide band={band} />}

      <p className="text-[11px] px-1 leading-relaxed" style={{ color: SUB }}>
        Source: CDC “Learn the Signs. Act Early.” (2022 revision) for ages 2 months–5 years; CDC child-development guidance for 6–14 years. Not a substitute for standardized, validated developmental screening. If you have concerns, talk with your child's doctor. <a href={MS_SOURCE} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>cdc.gov <ExternalLink size={10} className="inline" /></a>
      </p>
    </div>
  );
}

function MsChecklist({ band, status, onSave, sel }) {
  const cur = status[sel] || {};
  const setItem = (key, val) => onSave({ ...status, [sel]: { ...cur, [key]: cur[key] === val ? undefined : val } });
  const all = MS_CATS.flatMap(([ck]) => (band.data[ck] || []).map((_, i) => ck + i));
  const yes = all.filter((k) => cur[k] === "yes").length;
  const watch = all.filter((k) => cur[k] === "notyet").length;
  return (
    <>
      <Card className="!p-3">
        <div className="flex items-center justify-between text-sm flex-wrap gap-1">
          <span style={{ color: SUB }}>Marked so far</span>
          <span><span style={{ color: "#4E8A3E" }}>{yes} reached</span> · <span style={{ color: "#C0785A" }}>{watch} to watch</span> · <span style={{ color: SUB }}>{all.length - yes - watch} unmarked</span></span>
        </div>
        {watch > 0 && <p className="text-[11px] mt-2" style={{ color: SUB }}>“To watch” items are good ones to raise with your care team — not a cause for alarm on their own.</p>}
      </Card>
      {MS_CATS.map(([ck, cname]) => {
        const items = band.data[ck] || [];
        if (!items.length) return null;
        return (
          <Card key={ck}>
            <h3 className="font-serif text-base mb-3">{cname}</h3>
            <div className="space-y-3">
              {items.map((t, i) => {
                const key = ck + i, val = cur[key];
                return (
                  <div key={key} className="flex items-start gap-3">
                    <p className="text-sm flex-1 leading-relaxed" style={{ color: "#3C4B50" }}>{t}</p>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setItem(key, "yes")} className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: val === "yes" ? "#6FB05A" : CARD, color: val === "yes" ? "#fff" : "#6FB05A", border: `1px solid ${val === "yes" ? "#6FB05A" : LINE}` }} title="Reached" aria-label="Reached"><Check size={15} /></button>
                      <button onClick={() => setItem(key, "notyet")} className="px-2 h-8 rounded-lg text-[11px] font-medium" style={{ background: val === "notyet" ? "#E8843C" : CARD, color: val === "notyet" ? "#fff" : "#C0785A", border: `1px solid ${val === "notyet" ? "#E8843C" : LINE}` }}>Not yet</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </>
  );
}

function MsGuide({ band }) {
  const g = band.data;
  const sections = [["social", "Social & emotional"], ["thinking", "Thinking & learning"]];
  return (
    <>
      <Card className="!p-3"><p className="text-xs" style={{ color: SUB }}>A general description of what's common at this stage — not a checklist and not a screening tool.</p></Card>
      {sections.map(([sk, sname]) => (
        <Card key={sk}>
          <h3 className="font-serif text-base mb-3">{sname}</h3>
          <ul className="space-y-2">
            {(g[sk] || []).map((t, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#3C4B50" }}><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ACCENT }} />{t}</li>)}
          </ul>
        </Card>
      ))}
    </>
  );
}

/* ---------- assessment ---------- */
function digest(notes) {
  const byDisc = {};
  notes.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((n) => (byDisc[n.discipline] = byDisc[n.discipline] || []).push(n));
  let out = "";
  DISC_KEYS.forEach((k) => { if (!byDisc[k]) return; out += `\n## ${k}\n`; byDisc[k].forEach((n) => { out += `- ${n.date} | ${n.domain}${n.skill ? " / " + n.skill : ""} | level ${n.progress}/5 (${levelInfo(n.progress).label}): ${n.content}\n`; }); });
  return out.trim();
}
function Assessment({ notes, profile, saved, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generate = async () => {
    setLoading(true); setError("");
    const age = ageFrom(profile.dob);
    const prompt = `You are a developmental pediatrician writing a warm, plain-language progress summary for a parent, based ONLY on the therapy notes below. Do not diagnose or invent facts. Where notes are thin, say so gently. Frame everything as support for the care team, not a replacement.

Child: ${profile.name || "the child"}${age ? `, age ${age}` : ""}.

Notes:
${digest(notes)}

Return ONLY valid JSON: {"overallSummary":"2-4 warm sentences","domainHighlights":[{"domain":"","trend":"improving | steady | needs attention | early","note":"one sentence"}],"wins":["..."],"focusAreas":["..."],"questionsForTeam":["..."]}`;
    try { onSave({ ...(await claudeJSON([{ type: "text", text: prompt }], 2000)), generatedAt: new Date().toISOString(), noteCount: notes.length }); }
    catch { setError("Couldn't generate just now. Please try again in a moment."); }
    finally { setLoading(false); }
  };
  if (notes.length === 0) return <Empty title="Add a few notes first" body="Once there are notes to read, this writes a plain-language summary across your whole care team." />;
  return (
    <div className="space-y-4">
      <Card style={{ background: "linear-gradient(180deg,#F0F7F5,#FFFFFF)" }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: ACCENT + "1A" }}><Sparkles size={20} style={{ color: ACCENT }} /></span>
          <div className="flex-1">
            <h2 className="font-serif text-lg">Developmental summary</h2>
            <p className="text-sm mt-0.5" style={{ color: SUB }}>Reads all {notes.length} notes and pulls together the trends, wins, and good questions for your next team meeting. A summary of what's documented — it supports your therapists' judgment, not replaces it.</p>
            <button onClick={generate} disabled={loading} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ background: ACCENT }}>{loading ? <><Loader2 size={16} className="animate-spin" /> Reading the notes…</> : <><Sparkles size={16} /> {saved ? "Regenerate" : "Generate summary"}</>}</button>
            {error && <p className="text-sm mt-2" style={{ color: "#C0492E" }}>{error}</p>}
          </div>
        </div>
      </Card>
      {saved && <>
        <Card><p className="text-[15px] leading-relaxed">{saved.overallSummary}</p><p className="text-[11px] mt-3" style={{ color: SUB }}>Generated {new Date(saved.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · from {saved.noteCount} notes</p></Card>
        {Array.isArray(saved.domainHighlights) && saved.domainHighlights.length > 0 && (
          <Card><h3 className="font-serif text-base mb-3 flex items-center gap-2"><ClipboardList size={16} style={{ color: ACCENT }} /> By area</h3><div className="space-y-2.5">{saved.domainHighlights.map((d, i) => <div key={i} className="flex gap-3"><TrendDot trend={d.trend} /><div><div className="text-sm font-medium">{d.domain} <span className="text-xs font-normal" style={{ color: SUB }}>· {d.trend}</span></div><div className="text-sm" style={{ color: "#3C4B50" }}>{d.note}</div></div></div>)}</div></Card>
        )}
        <div className="grid sm:grid-cols-2 gap-4"><ListCard title="Recent wins" Icon={Award} color="#6FB05A" items={saved.wins} /><ListCard title="Keep working on" Icon={Target} color="#E8843C" items={saved.focusAreas} /></div>
        <ListCard title="Questions for your next team meeting" Icon={HelpCircle} color={ACCENT} items={saved.questionsForTeam} />
      </>}
    </div>
  );
}
function TrendDot({ trend }) {
  const c = { improving: "#6FB05A", steady: "#0EA5E9", "needs attention": "#E8843C", early: "#B0A0C0" }[(trend || "").toLowerCase()] || SUB;
  return <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: c }} />;
}
function ListCard({ title, Icon, color, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return <Card><h3 className="font-serif text-base mb-3 flex items-center gap-2"><Icon size={16} style={{ color }} /> {title}</h3><ul className="space-y-2">{items.map((it, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#3C4B50" }}><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} /><span>{it}</span></li>)}</ul></Card>;
}

/* ---------- activities / recommendations ---------- */
const STATUS = { new: { label: "New", color: SUB }, trying: { label: "Trying", color: "#0EA5E9" }, worked: { label: "Worked", color: "#6FB05A" }, didnt: { label: "Didn't fit", color: "#C0492E" } };

function Activities({ notes, goals, profile, recs, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handout, setHandout] = useState(false);

  const generate = async () => {
    setLoading(true); setError("");
    const age = ageFrom(profile.dob);
    const goalLines = goals.filter((g) => g.status !== "achieved").map((g) => `- ${g.name} (${g.domain})`).join("\n") || "none set";
    const feedback = recs.filter((r) => r.status !== "new").map((r) => `- [${STATUS[r.status].label}] ${r.title}`).join("\n") || "none yet";
    const prompt = `You are a developmental pediatrician suggesting practical activities for a young child, based ONLY on the progress notes below. Activities must be play-based, low-prep, age-appropriate, and achievable. Tie each to a specific emerging skill. These are ideas for the family and teacher to try and discuss — never medical instructions.

Child: ${profile.name || "the child"}${age ? `, age ${age}` : ""}.
Active goals:
${goalLines}
Previously suggested (parent feedback — build on what worked, avoid repeating what didn't fit):
${feedback}

Progress notes:
${digest(notes)}

Return ONLY valid JSON: {"home":[{"title":"short name","activity":"2-3 sentence how-to for a parent","targetSkill":"the skill it builds","why":"one short sentence"}],"school":[{"title":"","activity":"2-3 sentences a teacher/therapist could use in the classroom","targetSkill":"","why":""}]}. Give 3-4 items per list.`;
    try {
      const r = await claudeJSON([{ type: "text", text: prompt }], 2000);
      const mk = (scope) => (r[scope] || []).map((x) => ({ id: uid(), scope, ...x, status: "new" }));
      const kept = recs.filter((x) => x.status !== "new"); // preserve feedback history
      onSave([...mk("home"), ...mk("school"), ...kept]);
    } catch { setError("Couldn't generate just now. Please try again in a moment."); }
    finally { setLoading(false); }
  };

  const setStatus = (id, status) => onSave(recs.map((r) => r.id === id ? { ...r, status } : r));
  const home = recs.filter((r) => r.scope === "home");
  const school = recs.filter((r) => r.scope === "school");

  if (notes.length === 0) return <Empty title="Add a few notes first" body="Recommendations are built from your child's progress notes." />;

  return (
    <div className="space-y-4">
      <Card style={{ background: "linear-gradient(180deg,#F0F7F5,#FFFFFF)" }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: ACCENT + "1A" }}><Target size={20} style={{ color: ACCENT }} /></span>
          <div className="flex-1">
            <h2 className="font-serif text-lg">Activity suggestions</h2>
            <p className="text-sm mt-0.5" style={{ color: SUB }}>Play-based ideas for home and school, built from the latest progress. Mark what you try — feedback shapes the next round. Ideas to try and discuss with your care team, not medical advice.</p>
            <button onClick={generate} disabled={loading} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ background: ACCENT }}>{loading ? <><Loader2 size={16} className="animate-spin" /> Thinking of ideas…</> : <><Sparkles size={16} /> {recs.length ? "Refresh suggestions" : "Generate suggestions"}</>}</button>
            {error && <p className="text-sm mt-2" style={{ color: "#C0492E" }}>{error}</p>}
          </div>
        </div>
      </Card>

      {home.length > 0 && (
        <div>
          <h3 className="font-serif text-lg mb-2 flex items-center gap-2"><Home size={17} style={{ color: ACCENT }} /> At home</h3>
          <div className="space-y-3">{home.map((r) => <RecCard key={r.id} r={r} onStatus={setStatus} />)}</div>
        </div>
      )}

      {school.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg flex items-center gap-2"><GraduationCap size={17} style={{ color: ACCENT }} /> For school</h3>
            <button onClick={() => setHandout(true)} className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ color: ACCENT, border: `1px solid ${LINE}`, background: CARD }}><Share2 size={14} /> Handout</button>
          </div>
          <div className="space-y-3">{school.map((r) => <RecCard key={r.id} r={r} onStatus={setStatus} />)}</div>
        </div>
      )}

      {handout && <Handout profile={profile} notes={notes} school={school} onClose={() => setHandout(false)} />}
    </div>
  );
}

function RecCard({ r, onStatus }) {
  const st = STATUS[r.status] || STATUS.new;
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-medium text-[15px]">{r.title}</h4>
        <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ background: st.color + "18", color: st.color }}>{st.label}</span>
      </div>
      <p className="text-sm leading-relaxed mb-2" style={{ color: "#3C4B50" }}>{r.activity}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] mb-3" style={{ color: SUB }}>
        {r.targetSkill && <span className="inline-flex items-center gap-1"><Target size={11} /> {r.targetSkill}</span>}
        {r.why && <span className="italic">{r.why}</span>}
      </div>
      <div className="flex gap-2">
        {[["trying", "Trying"], ["worked", "Worked"], ["didnt", "Didn't fit"]].map(([k, lab]) => {
          const on = r.status === k;
          return <button key={k} onClick={() => onStatus(r.id, on ? "new" : k)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: on ? STATUS[k].color : CARD, color: on ? "#fff" : STATUS[k].color, border: `1px solid ${on ? STATUS[k].color : LINE}` }}>{lab}</button>;
        })}
      </div>
    </Card>
  );
}

function Handout({ profile, notes, school, onClose }) {
  const [copied, setCopied] = useState(false);
  const age = ageFrom(profile.dob);
  const snapshot = useMemo(() => {
    const map = {};
    notes.forEach((n) => (map[n.domain] = map[n.domain] || []).push(n));
    return DOMAINS.filter((d) => map[d]).map((d) => {
      const arr = map[d].slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
      return { domain: d, avg: arr.reduce((a, b) => a + b.progress, 0) / arr.length };
    }).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [notes]);

  const text = useMemo(() => {
    let t = `Home-School Support Ideas — ${profile.name || "Child"}${age ? ` (${age})` : ""}\nDate: ${fmtDate(todayStr())}\n\nRecent progress snapshot:\n`;
    snapshot.forEach((s) => (t += `• ${s.domain}: ${levelInfo(Math.round(s.avg)).label}\n`));
    t += `\nSuggested classroom / therapy activities:\n`;
    school.forEach((r, i) => (t += `${i + 1}. ${r.title}\n   ${r.activity}\n   Targets: ${r.targetSkill || "—"}\n`));
    t += `\nShared from a home progress tracker to support our team's work. These are ideas to discuss, not clinical recommendations.`;
    return t;
  }, [snapshot, school, profile, age]);

  const doCopy = async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 1800); } };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(23,49,58,0.45)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-auto">
        <div className="no-print sticky top-0 flex items-center justify-between px-4 py-3" style={{ background: CARD, borderBottom: `1px solid ${LINE}` }}>
          <span className="font-medium">Teacher handout</span>
          <button onClick={onClose} className="p-1.5" style={{ color: SUB }}><X size={18} /></button>
        </div>

        <div id="handout" className="p-5">
          <h1 className="font-serif text-xl">Home-School Support Ideas</h1>
          <p className="text-sm mt-0.5" style={{ color: SUB }}>{profile.name || "Child"}{age ? ` · ${age}` : ""} · {fmtDate(todayStr())}</p>

          <h2 className="font-serif text-base mt-5 mb-2">Recent progress snapshot</h2>
          <div className="space-y-1.5">
            {snapshot.map((s) => <div key={s.domain} className="flex justify-between text-sm"><span>{s.domain}</span><span style={{ color: levelInfo(Math.round(s.avg)).color }}>{levelInfo(Math.round(s.avg)).label}</span></div>)}
          </div>

          <h2 className="font-serif text-base mt-5 mb-2">Suggested classroom / therapy activities</h2>
          <ol className="space-y-3">
            {school.map((r, i) => (
              <li key={r.id} className="text-sm">
                <span className="font-medium">{i + 1}. {r.title}</span>
                <p className="mt-0.5" style={{ color: "#3C4B50" }}>{r.activity}</p>
                {r.targetSkill && <p className="text-xs mt-0.5" style={{ color: SUB }}>Targets: {r.targetSkill}</p>}
              </li>
            ))}
          </ol>
          <p className="text-xs mt-5 pt-3" style={{ color: SUB, borderTop: `1px solid ${LINE}` }}>Shared from a home progress tracker to support our team's work. Ideas to discuss, not clinical recommendations.</p>
        </div>

        <div className="no-print flex gap-2 p-4" style={{ borderTop: `1px solid ${LINE}` }}>
          <button onClick={doCopy} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium inline-flex items-center justify-center gap-2" style={{ background: ACCENT }}>{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy text</>}</button>
          <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2" style={{ color: ACCENT, border: `1px solid ${LINE}` }}><Printer size={16} /> Print / PDF</button>
        </div>
      </div>
    </div>
  );
}


/* ---------- ask the panel ---------- */
function AskPanel({ notes, profile, chat, onSave }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat.length, busy]);

  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ(""); setError(""); setBusy(true);
    const next = [...chat, { role: "user", text: question, at: Date.now() }];
    onSave(next);
    const age = ageFrom(profile.dob);
    const history = next.slice(-8).map((m) => `${m.role === "user" ? "Parent" : "Panel"}: ${m.text}`).join("\n\n");
    const prompt = `You are an experienced multidisciplinary child-development panel — developmental pediatrician, speech-language pathologist, occupational therapist, ABA therapist, and SPED teacher — supporting the parent of ${profile.name || "a young child"}${age ? ` (${age})` : ""} who is in therapy.

Ground your answer in the child's documented progress notes below when relevant, and say when the notes don't cover something. Be warm, practical, plain-language, and concise (under 250 words unless the question truly needs more). You are NOT the child's treating clinician: do not diagnose, do not give medication advice, and point significant clinical decisions back to the child's actual care team. If something sounds urgent or medical, tell the parent to contact their doctor.

Child's progress notes:
${digest(notes) || "(no notes logged yet)"}

Conversation so far:
${history}

Reply to the parent's last message. Plain text only, no markdown headers.`;
    try {
      const a = await claudeText([{ type: "text", text: prompt }], 1200);
      onSave([...next, { role: "assistant", text: a, at: Date.now() }]);
    } catch { setError("Couldn't answer just now. Please try again."); }
    finally { setBusy(false); }
  };

  const starters = [
    "How can we build more words at home?",
    "What should I ask at our next team meeting?",
    "How do I handle meltdowns during transitions?",
  ];

  return (
    <div className="space-y-4">
      <Card style={{ background: "linear-gradient(180deg,#F0F7F5,#FFFFFF)" }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: ACCENT + "1A" }}><Bot size={20} style={{ color: ACCENT }} /></span>
          <div className="flex-1">
            <h2 className="font-serif text-lg">Ask the panel</h2>
            <p className="text-sm mt-0.5" style={{ color: SUB }}>Answers drawing on developmental pediatrics, speech, OT, ABA, and SPED perspectives — grounded in your child's notes. Information and ideas, not medical advice; clinical decisions stay with your real care team.</p>
          </div>
          {chat.length > 0 && <button onClick={() => { if (window.confirm("Clear this conversation?")) onSave([]); }} className="text-xs shrink-0" style={{ color: SUB }}>Clear</button>}
        </div>
      </Card>

      {chat.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {starters.map((s) => <button key={s} onClick={() => ask(s)} className="text-xs px-3 py-2 rounded-full" style={{ border: `1px solid ${LINE}`, background: CARD, color: ACCENT }}>{s}</button>)}
        </div>
      )}

      <div className="space-y-3">
        {chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap" style={m.role === "user" ? { background: ACCENT, color: "#fff" } : { background: CARD, border: `1px solid ${LINE}`, color: "#3C4B50" }}>{m.text}</div>
          </div>
        ))}
        {busy && <div className="flex justify-start"><div className="rounded-2xl px-4 py-2.5" style={{ background: CARD, border: `1px solid ${LINE}` }}><Loader2 size={16} className="animate-spin" style={{ color: ACCENT }} /></div></div>}
        {error && <p className="text-sm" style={{ color: "#C0492E" }}>{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 items-end">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} rows={2} placeholder="Ask anything about your child's development…" className="flex-1 px-3 py-2 rounded-xl text-sm leading-relaxed resize-none" style={{ border: `1px solid ${LINE}`, background: CARD }} />
        <button onClick={() => ask()} disabled={busy || !q.trim()} className="w-11 h-11 rounded-xl grid place-items-center text-white disabled:opacity-40 shrink-0" style={{ background: ACCENT }} aria-label="Send"><Send size={18} /></button>
      </div>
      <p className="text-[11px] px-1" style={{ color: SUB }}>Each question sends your child's notes to the AI so answers can be grounded in them.</p>
    </div>
  );
}
