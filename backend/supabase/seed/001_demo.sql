insert into departments(name,code) values
('Computer Science','CSE'),('Electronics & Communication','ECE'),('Mechanical Engineering','ME'),('Civil Engineering','CE')
on conflict (code) do nothing;
