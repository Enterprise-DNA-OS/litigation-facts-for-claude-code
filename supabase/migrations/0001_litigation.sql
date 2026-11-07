create table matters (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), name text not null check(length(trim(name))>0), owner text not null default '',
 status text not null default 'open' check(status in ('open','closed')), purpose text not null default '', retention_review_on date, access_review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table facts (
 id uuid primary key default gen_random_uuid(), matter_id uuid not null references matters(id), code text not null, name text not null check(length(trim(name))>0), occurred_on date, date_precision text not null default 'unknown' check(date_precision in ('day','month','year','unknown')),
 owner text not null default '', review_due date, revision integer not null default 1, reviewed_revision integer, reviewed_by text, review_note text,
 position text not null default 'alleged' check(position in ('alleged','agreed','disputed')), source_data jsonb not null default '{}', external_id text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(matter_id,code), unique(matter_id,external_id), unique(matter_id,id),
 check((occurred_on is null and date_precision='unknown') or (occurred_on is not null and date_precision<>'unknown'))
);
create table sources (
 id uuid primary key default gen_random_uuid(), matter_id uuid not null references matters(id), code text not null, name text not null, locator text not null default '',
 confidentiality text not null default 'unreviewed' check(confidentiality in ('unreviewed','ordinary','confidential','privileged')), revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(matter_id,code),unique(matter_id,id)
);
create table issues (
 id uuid primary key default gen_random_uuid(), matter_id uuid not null references matters(id), code text not null, name text not null, owner text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(matter_id,code),unique(matter_id,id)
);
create table witnesses (
 id uuid primary key default gen_random_uuid(), matter_id uuid not null references matters(id), code text not null,name text not null, role text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(matter_id,code),unique(matter_id,id)
);
create table citations (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references matters(id),fact_id uuid not null,source_id uuid not null,
 pinpoint text not null check(length(trim(pinpoint))>0), stance text not null check(stance in ('supports','disputes')), source_revision integer not null, fact_revision integer not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(matter_id,fact_id) references facts(matter_id,id),foreign key(matter_id,source_id) references sources(matter_id,id),unique(fact_id,source_id,pinpoint,stance)
);
create table fact_issues (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references matters(id),fact_id uuid not null,issue_id uuid not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(matter_id,fact_id) references facts(matter_id,id),foreign key(matter_id,issue_id) references issues(matter_id,id),unique(fact_id,issue_id)
);
create table fact_witnesses (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references matters(id),fact_id uuid not null,witness_id uuid not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(matter_id,fact_id) references facts(matter_id,id),foreign key(matter_id,witness_id) references witnesses(matter_id,id),unique(fact_id,witness_id)
);
create table contradictions (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references matters(id),fact_id uuid not null,other_id uuid not null,note text not null check(length(trim(note))>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(matter_id,fact_id) references facts(matter_id,id),foreign key(matter_id,other_id) references facts(matter_id,id),check(fact_id<other_id),unique(fact_id,other_id)
);
create table tasks (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references matters(id),code text not null,name text not null,owner text not null default '',due_on date not null,status text not null default 'open' check(status in ('open','done')),completion_note text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(matter_id,code)
);
create table activity (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity, entity text not null,record_id uuid not null,actor text not null,action text not null,before_data jsonb,after_data jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create function touch_revision() returns trigger language plpgsql as $$begin
 new.updated_at=clock_timestamp();
 if tg_table_name='facts' then
  if (to_jsonb(new)-array['updated_at','revision','reviewed_revision','reviewed_by','review_note']) is distinct from (to_jsonb(old)-array['updated_at','revision','reviewed_revision','reviewed_by','review_note']) then
   new.revision=old.revision+1;new.reviewed_revision=null;new.reviewed_by=null;new.review_note=null;
  end if;
 elsif tg_table_name='sources' then
  if (to_jsonb(new)-array['updated_at','revision']) is distinct from (to_jsonb(old)-array['updated_at','revision']) then new.revision=old.revision+1;end if;
 end if;
 return new;end$$;
create function record_activity() returns trigger language plpgsql as $$begin
 insert into activity(entity,record_id,actor,action,before_data,after_data) values(tg_table_name,new.id,coalesce(nullif(current_setting('app.actor',true),''),'database operator'),tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));return new;end$$;
do $$declare t text;begin foreach t in array array['matters','facts','sources','issues','witnesses','citations','fact_issues','fact_witnesses','contradictions','tasks','activity'] loop
 execute format('alter table %I enable row level security',t);execute format('revoke all on %I from public',t);
 execute format('create trigger touch before update on %I for each row execute function touch_revision()',t);
 if t<>'activity' then execute format('create trigger audit after insert or update on %I for each row execute function record_activity()',t);end if;
end loop;end$$;
create index facts_matter_date on facts(matter_id,occurred_on);
create index citations_fact on citations(fact_id);
create view v_chronology with(security_invoker=true) as
 select f.id,f.matter_id,m.code as matter,f.code,f.occurred_on,f.date_precision,f.name as fact,f.position,f.owner,f.review_due,
 f.revision=f.reviewed_revision as reviewed,
 (select count(*)::integer from citations c join sources s on s.id=c.source_id where c.fact_id=f.id and c.fact_revision=f.revision and c.source_revision=s.revision and c.stance='supports') as current_support,
 (select count(*)::integer from citations c join sources s on s.id=c.source_id where c.fact_id=f.id and (c.fact_revision<>f.revision or c.source_revision<>s.revision)) as stale_citations,
 (select count(*)::integer from citations c where c.fact_id=f.id and c.stance='disputes') as disputing_citations,
 (select count(*)::integer from contradictions c where c.fact_id=f.id or c.other_id=f.id) as conflicts
 from facts f join matters m on m.id=f.matter_id;
create view v_issue_proof with(security_invoker=true) as
 select i.id,i.matter_id,i.code,i.name as issue,i.owner,count(f.id)::integer as facts,
 count(f.id) filter(where f.current_support>0 and f.reviewed and f.stale_citations=0)::integer as reviewed_supported,
 count(f.id) filter(where f.conflicts>0 or f.disputing_citations>0)::integer as contested
 from issues i left join fact_issues l on l.issue_id=i.id left join v_chronology f on f.id=l.fact_id group by i.id;
create view v_attention with(security_invoker=true) as
 select matter_id,code,fact as name,owner,'citation_gap'::text as finding from v_chronology where current_support=0
 union all select matter_id,code,fact,owner,'stale_citation' from v_chronology where stale_citations>0
 union all select matter_id,code,fact,owner,'overdue_review' from v_chronology where reviewed is not true and review_due<current_date
 union all select matter_id,code,fact,owner,'undated_fact' from v_chronology where occurred_on is null
 union all select matter_id,code,name,owner,'overdue_task' from tasks where status='open' and due_on<current_date
 union all select matter_id,code,issue,owner,'unproven_issue' from v_issue_proof where reviewed_supported=0;
create view v_compliance with(security_invoker=true) as
 select id as matter_id,code,'IPP5'::text as rule,'Access safeguard review missing or overdue'::text as finding,'https://www.privacy.org.nz/privacy-principles/5/'::text as source from matters where access_review_on is null or access_review_on<current_date
 union all select id,code,'IPP9','Purpose or retention review missing or overdue','https://www.privacy.org.nz/privacy-principles/9/' from matters where trim(purpose)='' or retention_review_on is null or retention_review_on<current_date
 union all select matter_id,code,'LOCAL-CITATION','Evidence citation needs review','docs/compliance.md' from v_chronology where current_support=0 or stale_citations>0
 union all select matter_id,code,'LOCAL-PRIVILEGE','Source confidentiality not reviewed','docs/compliance.md' from sources where confidentiality='unreviewed';
revoke all on v_chronology,v_issue_proof,v_attention,v_compliance from public;
