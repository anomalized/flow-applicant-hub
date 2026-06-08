
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws uuid := public.current_workspace_id();
  role text := public.current_user_role();
  job1 uuid; job2 uuid; job3 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid;
BEGIN
  IF ws IS NULL THEN
    RAISE EXCEPTION 'no workspace for current user';
  END IF;
  IF role NOT IN ('admin','owner') THEN
    RAISE EXCEPTION 'only admin or owner can seed demo data';
  END IF;

  INSERT INTO public.jobs (workspace_id, title, department, status, due_date, description)
  VALUES
    (ws, 'Senior Frontend Engineer', 'Engineering', 'open', (now() + interval '30 days')::date, 'Build delightful product experiences with React and TypeScript.'),
    (ws, 'Product Designer', 'Design', 'open', (now() + interval '21 days')::date, 'Own end-to-end design for core product surfaces.'),
    (ws, 'Customer Success Manager', 'Customer Success', 'open', (now() + interval '45 days')::date, 'Drive adoption and renewal across our enterprise accounts.')
  RETURNING id INTO job1;

  SELECT id INTO job2 FROM public.jobs WHERE workspace_id = ws AND title = 'Product Designer' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO job3 FROM public.jobs WHERE workspace_id = ws AND title = 'Customer Success Manager' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO job1 FROM public.jobs WHERE workspace_id = ws AND title = 'Senior Frontend Engineer' ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Ava Thompson', 'ava.thompson@example.com', '+1 415 555 0142') RETURNING id INTO c1;
  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Marcus Chen', 'marcus.chen@example.com', '+1 415 555 0188') RETURNING id INTO c2;
  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Priya Natarajan', 'priya.n@example.com', '+1 415 555 0119') RETURNING id INTO c3;
  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Liam O''Connor', 'liam.oconnor@example.com', '+353 1 555 0177') RETURNING id INTO c4;
  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Sofia Alvarez', 'sofia.alvarez@example.com', '+34 91 555 0163') RETURNING id INTO c5;
  INSERT INTO public.candidates (workspace_id, full_name, email, phone) VALUES
    (ws, 'Noah Kim', 'noah.kim@example.com', '+82 2 555 0124') RETURNING id INTO c6;

  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job1, c1, 'interview') RETURNING id INTO a1;
  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job1, c2, 'screening') RETURNING id INTO a2;
  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job2, c3, 'applied') RETURNING id INTO a3;
  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job2, c4, 'offer') RETURNING id INTO a4;
  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job3, c5, 'interview') RETURNING id INTO a5;
  INSERT INTO public.applications (workspace_id, job_id, candidate_id, stage) VALUES (ws, job3, c6, 'rejected') RETURNING id INTO a6;

  INSERT INTO public.interviews (workspace_id, application_id, scheduled_at, type, status) VALUES
    (ws, a1, now() + interval '2 days', 'video', 'scheduled'),
    (ws, a2, now() + interval '4 days', 'phone', 'scheduled'),
    (ws, a5, now() + interval '6 days', 'onsite', 'scheduled');

  INSERT INTO public.offers (workspace_id, application_id, salary, currency, status, expires_at) VALUES
    (ws, a4, 95000, 'USD', 'sent', now() + interval '10 days');

  INSERT INTO public.activity_log (workspace_id, actor_id, action) VALUES
    (ws, auth.uid(), 'Seeded demo data');

  RETURN jsonb_build_object('jobs', 3, 'candidates', 6, 'applications', 6, 'interviews', 3, 'offers', 1);
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
