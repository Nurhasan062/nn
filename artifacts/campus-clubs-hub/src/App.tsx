import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowRight, BadgeDollarSign, Bookmark, Building2, CalendarDays, Check, ChevronRight,
  Clock3, Compass, ExternalLink, Heart, LayoutGrid, Mail, MapPin, Menu, RotateCcw,
  Search, SlidersHorizontal, Sparkles, Ticket, Users, Verified, X,
} from 'lucide-react';
import {
  getGetClubQueryKey, getGetDashboardQueryKey, getGetEventQueryKey, getListClubsQueryKey,
  getListEventsQueryKey, getListSavedClubsQueryKey, useGetClub, useGetDashboard, useGetEvent,
  useHealthCheck, useListClubs, useListEvents, useListSavedClubs, useRegisterForEvent,
  useSaveClub, useUnsaveClub,
} from '@workspace/api-client-react';
import type { Club, ClubDetail, Event, EventDetail } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
const palette = ['#e86e54', '#368f8b', '#d6a52b', '#805c9b', '#4e79a7'];

function fmtDate(value?: string, compact = false) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', compact ? { month: 'short', day: 'numeric' } : { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}
function fmtTime(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
function money(value: number) { return value === 0 ? 'Free' : `$${value.toFixed(2)}`; }
function accentFor(value?: string, index = 0) { return value || palette[index % palette.length]; }

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck();
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutGrid },
    { href: '/clubs', label: 'Find clubs', icon: Compass },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/saved', label: 'Saved', icon: Bookmark },
  ];
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12 flex items-center justify-between px-2">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Sparkles size={19} strokeWidth={2.5} /></span>
            <span><strong className="block text-[15px] tracking-tight">campus clubs</strong><span className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/60">student commons</span></span>
          </Link>
          <button aria-label="Close menu" data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-white/10 md:hidden"><X size={18} /></button>
        </div>
        <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Explore campus</p>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground'}`}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span>{active && <ChevronRight className="ml-auto" size={15} />}
            </Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-secondary">Quick note</p>
          <p className="mt-3 text-sm leading-5 text-sidebar-foreground/80">Your next community is probably one good conversation away.</p>
          <Link href="/clubs" data-testid="link-sidebar-discover" className="mt-4 flex items-center gap-2 text-xs font-semibold text-secondary">Browse the directory <ArrowRight size={13} /></Link>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" data-testid="button-navigation-overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-foreground/30 md:hidden" />}
      <div className="md:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button aria-label="Open menu" data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden"><Menu size={21} /></button>
          <div data-testid="status-campus-health" className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"><span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-accent' : 'bg-[#49a889]'}`} /> {health.isError ? 'Campus services are reconnecting' : 'Spring term · campus is in session'}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right sm:block"><span className="block text-xs font-semibold">Ari Morgan</span><span className="font-mono text-[10px] text-muted-foreground">undergraduate · year 2</span></span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">AM</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1380px] px-5 py-8 md:px-10 md:py-11">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow: string; title: React.ReactNode; copy?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div className="rise-in">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent"><span className="h-px w-6 bg-accent" />{eyebrow}</div>
      <h1 className="max-w-3xl text-4xl font-bold tracking-[-.045em] text-foreground md:text-5xl">{title}</h1>
      {copy && <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">{copy}</p>}
    </div>
    {action && <div className="rise-in delay-1">{action}</div>}
  </div>;
}

function StatCard({ label, value, note, color }: { label: string; value: string | number; note: string; color: string }) {
  return <div className="rise-in rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_24px_rgba(43,48,75,.04)]" style={{ borderTop: `3px solid ${color}` }}>
    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</p>
    <div className="mt-3 flex items-end justify-between"><strong className="text-3xl tracking-tight">{value}</strong><span className="text-xs text-muted-foreground">{note}</span></div>
  </div>;
}

function SaveButton({ club, compact = false }: { club: Club; compact?: boolean }) {
  const client = useQueryClient();
  const save = useSaveClub();
  const unsave = useUnsaveClub();
  const pending = save.isPending || unsave.isPending;
  const toggle = () => {
    const mutation = club.isSaved ? unsave : save;
    mutation.mutate({ id: club.id }, { onSuccess: () => {
      client.invalidateQueries({ queryKey: getListSavedClubsQueryKey() });
      client.invalidateQueries({ queryKey: getListClubsQueryKey() });
      client.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      client.invalidateQueries({ queryKey: getGetClubQueryKey(club.id) });
    }});
  };
  return <button aria-label={club.isSaved ? `Remove ${club.name} from saved clubs` : `Save ${club.name}`} data-testid={`button-save-club-${club.id}`} disabled={pending} onClick={toggle} className={`button-pop inline-flex items-center justify-center gap-2 rounded-lg transition-colors ${compact ? 'h-9 w-9' : 'px-3 py-2 text-xs font-semibold'} ${club.isSaved ? 'bg-secondary text-secondary-foreground' : 'border border-border bg-card text-muted-foreground hover:border-accent hover:text-accent'}`}>
    {pending ? <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-current/40" /> : club.isSaved ? <Heart size={15} fill="currentColor" /> : <Bookmark size={15} />}{!compact && (club.isSaved ? 'Saved' : 'Save')}
  </button>;
}

function ClubMark({ club, large = false }: { club: Club; large?: boolean }) {
  return <div className={`grid shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${large ? 'h-16 w-16 text-lg rounded-2xl' : 'h-11 w-11'}`} style={{ backgroundColor: accentFor(club.accent) }}>{club.shortName.slice(0, 3).toUpperCase()}</div>;
}

function ClubCard({ club, index = 0 }: { club: Club; index?: number }) {
  return <article data-testid={`card-club-${club.id}`} className={`accent-bar rise-in delay-${Math.min(index + 1, 4)} group rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_24px_rgba(43,48,75,.04)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(43,48,75,.10)]`} style={{ '--accent-color': accentFor(club.accent, index) } as React.CSSProperties}>
    <div className="flex items-start justify-between gap-3"><Link href={`/clubs/${club.id}`} data-testid={`link-club-${club.id}`}><ClubMark club={club} /></Link><SaveButton club={club} compact /></div>
    <Link href={`/clubs/${club.id}`} data-testid={`link-club-title-${club.id}`} className="mt-5 block"><div className="flex items-center gap-1.5"><h3 className="font-semibold tracking-tight group-hover:text-accent">{club.name}</h3>{club.isVerified && <Verified size={14} className="text-[#368f8b]" fill="currentColor" stroke="hsl(var(--card))" />}</div><p className="mt-1 text-sm leading-5 text-muted-foreground">{club.tagline}</p></Link>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-[11px] text-muted-foreground"><span>{club.category}</span><span className="flex items-center gap-1"><Users size={13} />{club.memberCount.toLocaleString()} members</span></div>
  </article>;
}

function EventRow({ event, index = 0 }: { event: Event; index?: number }) {
  return <Link href={`/events/${event.id}`} data-testid={`card-event-${event.id}`} className={`rise-in delay-${Math.min(index + 1, 4)} group grid grid-cols-[54px_1fr_auto] items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_8px_24px_rgba(43,48,75,.035)] transition-all hover:-translate-y-0.5 hover:border-accent/50 md:grid-cols-[72px_1fr_190px_auto]`}>
    <div className="text-center"><span className="font-mono text-[10px] uppercase text-accent">{fmtDate(event.startsAt, true).split(' ')[0]}</span><strong className="mt-1 block text-2xl leading-none tracking-tight">{new Date(event.startsAt).getDate()}</strong><span className="text-[10px] text-muted-foreground">{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(event.startsAt))}</span></div>
    <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{event.clubName} · {event.category}</p><h3 className="mt-1 truncate font-semibold tracking-tight group-hover:text-accent">{event.title}</h3><p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin size={12} />{event.venue}</p></div>
    <div className="hidden text-xs md:block"><p className="flex items-center gap-1.5"><Clock3 size={14} className="text-accent" />{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</p><p className="mt-1 text-muted-foreground">{event.spotsLeft} spots left</p></div>
    <ChevronRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
  </Link>;
}

function LoadingCards({ count = 3 }: { count?: number }) { return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="h-52 rounded-2xl border border-border bg-card p-5"><div className="skeleton h-11 w-11 rounded-xl" /><div className="skeleton mt-5 h-5 w-3/4 rounded" /><div className="skeleton mt-3 h-4 w-full rounded" /><div className="skeleton mt-10 h-3 w-1/2 rounded" /></div>)}</div>; }
function ErrorState({ onRetry }: { onRetry?: () => void }) { return <div className="rounded-2xl border border-dashed border-accent/50 bg-accent/5 px-6 py-12 text-center"><p className="font-semibold">We hit a snag loading this view.</p><p className="mt-1 text-sm text-muted-foreground">Give it another try. Your campus is still here.</p>{onRetry && <button data-testid="button-retry" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><RotateCcw size={15} /> Retry</button>}</div>; }
function EmptyState({ title, copy, href, label }: { title: string; copy: string; href?: string; label?: string }) { return <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Compass size={21} /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-muted-foreground">{copy}</p>{href && <Link href={href} data-testid="link-empty-action" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{label}</Link>}</div>; }

function Home() {
  const { data, isLoading, isError, refetch } = useGetDashboard();
  if (isLoading) return <><PageIntro eyebrow="Your campus, in one place" title="Find your people." copy="A quick read on what is happening across campus today." /><LoadingCards count={3} /></>;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  return <div>
    <PageIntro eyebrow="Thursday · spring term" title={<>Find your people.<br /><span className="text-accent">Make your mark.</span></>} copy="The clubs, conversations, and small moments that make campus feel like yours." action={<Link href="/clubs" data-testid="link-home-find-clubs" className="button-pop inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Explore clubs <ArrowRight size={16} /></Link>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Clubs to explore" value={data.clubCount} note="across campus" color="#e86e54" /><StatCard label="Upcoming events" value={data.eventCount} note="on the calendar" color="#368f8b" /><StatCard label="Saved for later" value={data.savedCount} note="your shortlist" color="#d6a52b" /><StatCard label="This week" value={data.thisWeekEvents} note="ways to show up" color="#805c9b" />
    </div>
    <div className="mt-10 grid gap-7 lg:grid-cols-[1.25fr_.75fr]">
      <section><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">A little nudge</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Clubs worth a closer look</h2></div><Link href="/clubs" data-testid="link-home-all-clubs" className="flex items-center gap-1 text-xs font-semibold text-accent">See all <ArrowRight size={14} /></Link></div>{data.featuredClubs?.length ? <div className="grid gap-4 md:grid-cols-2">{data.featuredClubs.slice(0, 4).map((club, i) => <ClubCard key={club.id} club={club} index={i} />)}</div> : <EmptyState title="The directory is warming up" copy="No featured clubs have been added yet. Browse the full directory instead." href="/clubs" label="Browse clubs" />}</section>
      <section><div className="mb-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">Next on campus</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Your next event</h2></div>{data.nextEvent ? <Link href={`/events/${data.nextEvent.id}`} data-testid={`card-next-event-${data.nextEvent.id}`} className="group block overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_35px_rgba(39,45,74,.16)]"><div className="h-2" style={{ backgroundColor: accentFor(data.nextEvent.accent) }} /><div className="p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em]">{fmtDate(data.nextEvent.startsAt, true)}</span><Ticket size={18} className="text-secondary" /></div><h3 className="mt-8 max-w-xs text-2xl font-bold leading-tight tracking-tight">{data.nextEvent.title}</h3><p className="mt-3 text-sm text-primary-foreground/65">{data.nextEvent.clubName}</p><div className="mt-8 space-y-3 border-t border-white/15 pt-4 text-sm text-primary-foreground/80"><p className="flex items-center gap-2"><Clock3 size={15} className="text-secondary" />{fmtTime(data.nextEvent.startsAt)} · {data.nextEvent.venue}</p><p className="flex items-center gap-2"><Users size={15} className="text-secondary" />{data.nextEvent.spotsLeft} spots left</p></div><div className="mt-6 flex items-center gap-2 text-sm font-semibold text-secondary">View event <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></div></div></Link> : <EmptyState title="Nothing next, yet" copy="Keep an eye on the events explorer for the next good thing." href="/events" label="See upcoming events" />}</section>
    </div>
    <section className="mt-10 rounded-2xl border border-border bg-secondary/45 p-6 md:flex md:items-center md:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-secondary-foreground/60">Campus pulse</p><h2 className="mt-2 text-xl font-bold tracking-tight">Small groups make a big campus feel smaller.</h2><p className="mt-1 text-sm text-secondary-foreground/70">Browse by what you want to feel, not just what you study.</p></div><Link href="/events" data-testid="link-home-events" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary-foreground md:mt-0">Find something happening <ArrowRight size={15} /></Link></section>
  </div>;
}

function ClubsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'popular' | 'alphabetical' | 'active'>('popular');
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(category ? { category } : {}), sort }), [search, category, sort]);
  const query = useListClubs(params);
  const clubs = query.data || [];
  const categories = useMemo(() => Array.from(new Set(clubs.map(c => c.category))).sort(), [clubs]);
  return <div><PageIntro eyebrow="The directory" title="Find your corner of campus." copy="Search by name, browse by energy, and save the clubs that feel like a maybe." action={<div className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"><span className="font-mono text-lg">{clubs.length}</span> <span className="ml-1 font-normal">clubs showing</span></div>} />
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row"><label className="flex flex-1 items-center gap-3 rounded-xl bg-muted/70 px-3"><Search size={17} className="text-muted-foreground" /><input data-testid="input-club-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs, interests, or names" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" /></label><label className="flex items-center gap-2 rounded-xl border border-border px-3 text-sm"><SlidersHorizontal size={15} className="text-muted-foreground" /><select data-testid="select-club-category" value={category} onChange={e => setCategory(e.target.value)} className="bg-transparent py-3 outline-none"><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label><select data-testid="select-club-sort" value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-xl border border-border bg-transparent px-4 py-3 text-sm outline-none"><option value="popular">Most popular</option><option value="alphabetical">A–Z</option><option value="active">Most active</option></select></div>
    {query.isLoading ? <LoadingCards count={6} /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : clubs.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{clubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />)}</div> : <EmptyState title="No clubs match that search" copy="Try a broader phrase or clear the filters. There are plenty of ways to get involved." href="/clubs" label="Clear search" />}</div>;
}

function ClubDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetClub(id, { query: { queryKey: getGetClubQueryKey(id) } });
  const eventQuery = useListEvents({ search: query.data?.name });
  if (query.isLoading) return <LoadingCards count={2} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const club = query.data as ClubDetail;
  return <div><Link href="/clubs" data-testid="link-back-clubs" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-accent"><ArrowRight size={15} className="rotate-180" /> All clubs</Link>
    <section className="relative overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground md:p-10"><div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[34px] border-secondary/20" /><div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><ClubMark club={club} large /><p className="mt-5 font-mono text-[10px] uppercase tracking-[.2em] text-secondary">{club.category} {club.isVerified && '· verified'}</p><h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-[-.045em] md:text-5xl">{club.name}</h1><p className="mt-3 max-w-xl text-base text-primary-foreground/70">{club.tagline}</p></div><SaveButton club={club} /></div><div className="relative mt-9 grid gap-4 border-t border-white/15 pt-5 text-sm text-primary-foreground/75 sm:grid-cols-3"><span className="flex items-center gap-2"><Users size={16} className="text-secondary" />{club.memberCount.toLocaleString()} members</span><span className="flex items-center gap-2"><Building2 size={16} className="text-secondary" />{club.officeLocation}</span><span className="flex items-center gap-2"><CalendarDays size={16} className="text-secondary" />{club.meetingSchedule}</span></div></section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><div className="space-y-8"><section><h2 className="text-xl font-bold tracking-tight">About the club</h2><p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{club.description}</p></section><section><h2 className="text-xl font-bold tracking-tight">Open roles</h2><div className="mt-4 space-y-3">{club.roles?.length ? club.roles.map(role => <div key={role.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-semibold">{role.title}</h3><span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] text-secondary-foreground">{role.openings} opening{role.openings === 1 ? '' : 's'}</span></div><p className="mt-4 text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Responsibilities</p><ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{role.responsibilities.map(item => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-accent" />{item}</li>)}</ul><div className="mt-4 flex flex-wrap gap-2">{role.skills.map(skill => <span key={skill} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{skill}</span>)}</div></div>) : <EmptyState title="No open roles right now" copy="Follow this club for their next call for members." />}</div></section></div>
      <aside className="space-y-4"><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Good to know</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Eligibility</dt><dd className="mt-1 leading-5">{club.eligibility}</dd></div><div><dt className="text-xs text-muted-foreground">Meetings</dt><dd className="mt-1 leading-5">{club.meetingSchedule}</dd></div><div><dt className="text-xs text-muted-foreground">Office</dt><dd className="mt-1 leading-5">{club.officeLocation}</dd></div><div><dt className="text-xs text-muted-foreground">Community size</dt><dd className="mt-1 leading-5">{club.joinedCount.toLocaleString()} joined this term</dd></div></dl>{club.socials?.length > 0 && <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{club.socials.map(social => <span key={social} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"><ExternalLink size={12} />{social}</span>)}</div>}</div><div><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Related events</h2><Link href="/events" data-testid="link-club-events" className="text-xs font-semibold text-accent">See all</Link></div>{eventQuery.data?.slice(0, 3).map((event, i) => <EventRow key={event.id} event={event} index={i} />)}</div></aside></div>
  </div>;
}

function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(category ? { category } : {}), timeframe }), [search, category, timeframe]);
  const query = useListEvents(params);
  const events = query.data || [];
  const categories = useMemo(() => Array.from(new Set(events.map(e => e.category))).sort(), [events]);
  return <div><PageIntro eyebrow="Show up for something" title="What’s happening next?" copy="Keep your calendar interesting. Find talks, practices, showcases, and the people who put them together." />
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row"><label className="flex flex-1 items-center gap-3 rounded-xl bg-muted/70 px-3"><Search size={17} className="text-muted-foreground" /><input data-testid="input-event-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events or clubs" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" /></label><select data-testid="select-event-category" value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-border bg-transparent px-4 py-3 text-sm outline-none"><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select><select data-testid="select-event-timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value as typeof timeframe)} className="rounded-xl border border-border bg-transparent px-4 py-3 text-sm outline-none"><option value="week">This week</option><option value="month">This month</option><option value="all">All upcoming</option></select></div>
    {query.isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : events.length ? <div className="space-y-3">{events.map((event, i) => <EventRow key={event.id} event={event} index={i} />)}</div> : <EmptyState title="No events found" copy="Try another filter, or check back soon for new ways to get involved." href="/events" label="Clear filters" />}</div>;
}

function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetEvent(id, { query: { queryKey: getGetEventQueryKey(id) } });
  const register = useRegisterForEvent();
  const client = useQueryClient();
  const [form, setForm] = useState({ studentName: '', studentEmail: '', year: '', department: '' });
  const [success, setSuccess] = useState(false);
  if (query.isLoading) return <LoadingCards count={2} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const event = query.data as EventDetail;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ id, data: form }, { onSuccess: () => { setSuccess(true); client.invalidateQueries({ queryKey: getGetEventQueryKey(id) }); client.invalidateQueries({ queryKey: getListEventsQueryKey() }); client.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); }});
  };
  return <div><Link href="/events" data-testid="link-back-events" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-accent"><ArrowRight size={15} className="rotate-180" /> All events</Link>
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]"><main><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-accent"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentFor(event.accent) }} />{event.category}</div><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-.045em] md:text-6xl">{event.title}</h1><p className="mt-4 text-base text-muted-foreground">{event.clubName}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">When</p><p className="mt-2 text-sm font-semibold">{fmtDate(event.startsAt)}</p><p className="mt-1 text-sm text-muted-foreground">{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Where</p><p className="mt-2 text-sm font-semibold">{event.venue}</p><p className="mt-1 text-sm text-muted-foreground">{event.dutyLeave ? 'Duty leave available' : 'Regular attendance'}</p></div></div><section className="mt-9"><h2 className="text-xl font-bold tracking-tight">About this event</h2><p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-muted-foreground">{event.description || 'The organizers will share more details soon. Save the date and check back before the event.'}</p></section><div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-secondary-foreground"><Users size={13} />{event.registeredCount} registered</span><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Ticket size={13} />{event.spotsLeft} spots left</span><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><BadgeDollarSign size={13} />{money(event.entryFee)}</span></div></main>
      <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(43,48,75,.06)]"><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-tight">{event.registrationRequired ? 'Save your spot' : 'Open to everyone'}</h2><span className="h-3 w-3 rounded-full bg-[#49a889]" /></div>{event.registrationRequired && !success ? <form onSubmit={submit} className="mt-6 space-y-4"><p className="text-sm leading-5 text-muted-foreground">{event.registrationCriteria || 'Share a few details so the organizers know who to expect.'}</p><label className="block text-sm font-semibold">Full name<input required minLength={2} data-testid="input-registration-name" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" placeholder="Your name" /></label><label className="block text-sm font-semibold">Student email<input required type="email" data-testid="input-registration-email" value={form.studentEmail} onChange={e => setForm({ ...form, studentEmail: e.target.value })} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent" placeholder="you@university.edu" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Year<select required data-testid="select-registration-year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none"><option value="">Select</option><option>First year</option><option>Second year</option><option>Third year</option><option>Fourth year</option><option>Graduate</option></select></label><label className="block text-sm font-semibold">Department<input required data-testid="input-registration-department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none" placeholder="e.g. Biology" /></label></div><button disabled={register.isPending || event.spotsLeft < 1} data-testid="button-register-event" className="button-pop mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50">{register.isPending ? 'Registering…' : event.spotsLeft < 1 ? 'Event is full' : 'Register for event'} <ArrowRight size={16} /></button>{register.isError && <p className="text-sm text-destructive">Registration did not go through. Check your details and try again.</p>}</form> : event.registrationRequired ? <></> : <div className="mt-6 rounded-xl bg-secondary/60 p-4 text-sm leading-5 text-secondary-foreground">You do not need to register for this event. Just bring yourself and show up.</div>}{success && <div data-testid="status-registration-success" className="mt-6 rounded-xl bg-secondary p-5 text-secondary-foreground"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#368f8b] text-white"><Check size={18} /></div><h3 className="mt-4 font-semibold">You’re on the list.</h3><p className="mt-1 text-sm leading-5 opacity-75">A confirmation is headed to {form.studentEmail}. See you there.</p></div>}<div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><Mail size={14} />Questions? <a data-testid="link-organizer-email" href={`mailto:${event.organizerEmail}`} className="font-semibold text-accent">{event.organizerEmail}</a></div></aside></div>
  </div>;
}

function SavedPage() {
  const query = useListSavedClubs();
  return <div><PageIntro eyebrow="Your shortlist" title="Saved for later." copy="The clubs you want to come back to, all in one quieter corner." action={<Link href="/clubs" data-testid="link-saved-add" className="button-pop inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold"><Compass size={16} /> Add more</Link>} />{query.isLoading ? <LoadingCards count={3} /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : query.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data.map((club, i) => <ClubCard key={club.id} club={{ ...club, isSaved: true }} index={i} />)}</div> : <EmptyState title="Your shortlist is empty" copy="When a club catches your attention, save it here so it is easy to find again." href="/clubs" label="Explore clubs" />}</div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Home} /><Route path="/clubs" component={ClubsPage} /><Route path="/clubs/:id" component={ClubDetailPage} /><Route path="/events" component={EventsPage} /><Route path="/events/:id" component={EventDetailPage} /><Route path="/saved" component={SavedPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;