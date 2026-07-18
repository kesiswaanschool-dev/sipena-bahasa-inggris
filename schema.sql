-- Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    nisn TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    semester TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpha')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    assessment_type TEXT NOT NULL,
    learning_material TEXT,
    subject TEXT NOT NULL,
    score NUMERIC NOT NULL,
    assessment_date DATE NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for students" ON public.students FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for assessments" ON public.assessments FOR ALL USING (true) WITH CHECK (true);

-- ADD NEW COLUMNS FOR RECAPITULATION & IDENTIFICATION
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_name TEXT;
