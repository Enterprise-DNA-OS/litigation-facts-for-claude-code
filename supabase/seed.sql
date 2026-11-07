insert into matters(id,code,name,owner,purpose,retention_review_on,access_review_on) values
 ('10000000-0000-0000-0000-000000000001','HARBOUR','Harbour supply dispute','Mara','Resolve the supply dispute',current_date+180,current_date-4),
 ('10000000-0000-0000-0000-000000000002','RIDGE','Ridge service dispute','Tane','',current_date-3,current_date+90) on conflict do nothing;
insert into facts(id,matter_id,code,name,occurred_on,date_precision,owner,review_due) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','F01','Supplier says delivery arrived before inspection',current_date-40,'day','Mara',current_date-3),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','F02','Warehouse log records delivery after inspection',current_date-39,'day','Tane',current_date-1),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','F03','Buyer recalls a verbal change to the specification',null,'unknown','Mara',current_date+2),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','F01','Service acceptance email received',current_date-10,'day','Tane',current_date+3) on conflict do nothing;
insert into sources(id,matter_id,code,name,locator,confidentiality) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','S01','Delivery note','evidence/delivery-note.pdf','ordinary'),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','S02','Warehouse log','evidence/warehouse-log.pdf','unreviewed') on conflict do nothing;
insert into citations(matter_id,fact_id,source_id,pinpoint,stance,source_revision,fact_revision) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','p 2','supports',1,1),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','entry 17','supports',1,1) on conflict do nothing;
insert into issues(id,matter_id,code,name,owner) values
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','I01','Delivery timing','Mara'),
 ('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','I02','Specification agreed','Tane') on conflict do nothing;
insert into witnesses(id,matter_id,code,name,role) values
 ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','W01','Jo Ellis','Warehouse manager'),
 ('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','W02','Jo Martin','Buyer') on conflict do nothing;
insert into fact_issues(matter_id,fact_id,issue_id) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into fact_witnesses(matter_id,fact_id,witness_id) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001') on conflict do nothing;
insert into contradictions(matter_id,fact_id,other_id,note) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Delivery sequence differs between the note and warehouse record') on conflict do nothing;
insert into tasks(matter_id,code,name,owner,due_on) values
 ('10000000-0000-0000-0000-000000000001','T01','Request original warehouse log','Tane',current_date-2),
 ('10000000-0000-0000-0000-000000000001','T02','Prepare Jo Ellis interview','Mara',current_date+3) on conflict do nothing;
