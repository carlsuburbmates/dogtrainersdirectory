-- Seed data: Melbourne councils, suburbs, trainers, reviews, emergency resources

-- ============================================
-- COUNCILS
-- ============================================
INSERT INTO councils (name, region) VALUES
  ('City of Melbourne', 'Inner City'),
  ('City of Yarra', 'Inner City'),
  ('City of Port Phillip', 'Inner City'),
  ('City of Stonnington', 'Inner City'),
  ('City of Moreland', 'Northern'),
  ('City of Darebin', 'Northern'),
  ('City of Banyule', 'Northern'),
  ('City of Boroondara', 'Eastern'),
  ('City of Whitehorse', 'Eastern'),
  ('City of Monash', 'South Eastern'),
  ('City of Glen Eira', 'South Eastern'),
  ('City of Kingston', 'South Eastern'),
  ('City of Hobsons Bay', 'Western'),
  ('City of Maribyrnong', 'Western'),
  ('City of Brimbank', 'Western')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SUBURBS (real Melbourne suburbs with real coords)
-- ============================================
INSERT INTO suburbs (name, postcode, latitude, longitude, council_id) VALUES
  ('Carlton', '3053', -37.7963, 144.9668, (SELECT id FROM councils WHERE name = 'City of Melbourne')),
  ('Fitzroy', '3065', -37.7997, 144.9782, (SELECT id FROM councils WHERE name = 'City of Yarra')),
  ('South Yarra', '3141', -37.8387, 144.9926, (SELECT id FROM councils WHERE name = 'City of Stonnington')),
  ('St Kilda', '3182', -37.8675, 144.9807, (SELECT id FROM councils WHERE name = 'City of Port Phillip')),
  ('Brunswick', '3056', -37.7671, 144.9601, (SELECT id FROM councils WHERE name = 'City of Moreland')),
  ('Northcote', '3070', -37.7706, 145.0030, (SELECT id FROM councils WHERE name = 'City of Darebin')),
  ('Heidelberg', '3084', -37.7569, 145.0649, (SELECT id FROM councils WHERE name = 'City of Banyule')),
  ('Hawthorn', '3122', -37.8218, 145.0340, (SELECT id FROM councils WHERE name = 'City of Boroondara')),
  ('Box Hill', '3128', -37.8189, 145.1218, (SELECT id FROM councils WHERE name = 'City of Whitehorse')),
  ('Clayton', '3168', -37.9146, 145.1196, (SELECT id FROM councils WHERE name = 'City of Monash')),
  ('Bentleigh', '3204', -37.9180, 145.0369, (SELECT id FROM councils WHERE name = 'City of Glen Eira')),
  ('Cheltenham', '3192', -37.9572, 145.0473, (SELECT id FROM councils WHERE name = 'City of Kingston')),
  ('Williamstown', '3016', -37.8657, 144.8989, (SELECT id FROM councils WHERE name = 'City of Hobsons Bay')),
  ('Footscray', '3011', -37.7996, 144.8994, (SELECT id FROM councils WHERE name = 'City of Maribyrnong')),
  ('Sunshine', '3020', -37.7880, 144.8326, (SELECT id FROM councils WHERE name = 'City of Brimbank')),
  ('Richmond', '3121', -37.8186, 144.9997, (SELECT id FROM councils WHERE name = 'City of Yarra')),
  ('Prahran', '3181', -37.8512, 144.9918, (SELECT id FROM councils WHERE name = 'City of Stonnington')),
  ('Collingwood', '3066', -37.8036, 144.9877, (SELECT id FROM councils WHERE name = 'City of Yarra')),
  ('Albert Park', '3206', -37.8446, 144.9564, (SELECT id FROM councils WHERE name = 'City of Port Phillip')),
  ('Coburg', '3058', -37.7449, 144.9660, (SELECT id FROM councils WHERE name = 'City of Moreland'))
ON CONFLICT DO NOTHING;

-- ============================================
-- BUSINESSES (12 realistic Melbourne trainers)
-- ============================================
INSERT INTO businesses (name, slug, phone, email, website, address, suburb_id, bio, short_bio, pricing, photo_url, verification_status, resource_type, years_experience, certifications, languages, is_mobile, service_radius_km, is_active, is_claimed, is_featured, average_rating, review_count, response_time_hours)
VALUES
(
  'Pawsitive Behaviours Melbourne',
  'pawsitive-behaviours-melbourne',
  '0412 345 678',
  'info@pawsitivebehaviours.com.au',
  'https://pawsitivebehaviours.com.au',
  '45 Lygon Street, Carlton VIC 3053',
  (SELECT id FROM suburbs WHERE name = 'Carlton'),
  'Sarah Mitchell is a certified veterinary behaviourist with over 12 years of experience working with dogs of all ages across Melbourne. Specialising in anxiety-related behaviours and rescue dog rehabilitation, Sarah uses only force-free, science-backed methods. Her approach combines structured training plans with real-world exercises, ensuring dogs and their owners build lasting confidence together. Sarah is passionate about helping first-time dog owners navigate the challenges of puppyhood and beyond.',
  'Force-free veterinary behaviourist specialising in anxiety and rescue dog rehabilitation.',
  'Initial consult: $180 | Follow-up sessions: $120 | 6-week puppy program: $450',
  NULL,
  'verified',
  'behaviour_consultant',
  12,
  ARRAY['Delta Institute Cert IV', 'AVSAB Member', 'Fear Free Certified'],
  ARRAY['English', 'Mandarin'],
  true,
  25,
  true,
  true,
  true,
  4.92,
  47,
  2
),
(
  'Melbourne Inner City Dog Training',
  'melbourne-inner-city-dog-training',
  '0423 456 789',
  'hello@innercitydogs.com.au',
  'https://innercitydogs.com.au',
  '12 Smith Street, Fitzroy VIC 3065',
  (SELECT id FROM suburbs WHERE name = 'Fitzroy'),
  'James Chen specialises in urban dog training for inner-city living. With 8 years of experience, he understands the unique challenges of apartment living, busy streets, and off-leash park etiquette. His group classes are held in Edinburgh Gardens every Saturday and are perfect for socialisation. James also offers private sessions for dogs with leash reactivity and separation anxiety, both common issues for city dogs.',
  'Urban dog training specialist for inner-city Melbourne living.',
  'Group classes: $35/session | Private training: $150/session | 4-week urban living course: $380',
  NULL,
  'verified',
  'trainer',
  8,
  ARRAY['Certificate IV in Companion Animal Services', 'PPGA Member'],
  ARRAY['English', 'Cantonese'],
  true,
  15,
  true,
  true,
  true,
  4.85,
  63,
  1
),
(
  'Southside Pups Academy',
  'southside-pups-academy',
  '0434 567 890',
  'train@southsidepups.com.au',
  'https://southsidepups.com.au',
  '88 Chapel Street, South Yarra VIC 3141',
  (SELECT id FROM suburbs WHERE name = 'South Yarra'),
  'Emma Rodriguez runs one of Melbourne''s most popular puppy training academies. Her structured 8-week programs have helped over 500 puppies and their families build strong foundations. Emma is known for her warm, patient approach and her ability to explain complex behaviour concepts in simple terms. The academy features purpose-built indoor and outdoor training areas, making it perfect for Melbourne''s unpredictable weather.',
  'Melbourne''s leading puppy training academy with purpose-built facilities.',
  'Puppy Foundations (8 weeks): $520 | Adolescent course: $480 | Private session: $160',
  NULL,
  'verified',
  'trainer',
  10,
  ARRAY['Delta Institute Cert IV', 'Puppy School Instructor Cert', 'Pet Professional Guild Member'],
  ARRAY['English', 'Spanish'],
  false,
  0,
  true,
  true,
  true,
  4.96,
  89,
  3
),
(
  'Bay City Behaviour',
  'bay-city-behaviour',
  '0445 678 901',
  'consult@baycitybehaviour.com.au',
  'https://baycitybehaviour.com.au',
  '22 Acland Street, St Kilda VIC 3182',
  (SELECT id FROM suburbs WHERE name = 'St Kilda'),
  'Dr. Lisa Pham is a PhD-qualified animal behaviourist who takes a clinical approach to behaviour modification. She works closely with local veterinarians to address complex cases including severe aggression, compulsive disorders, and multi-dog household conflicts. Lisa is one of only a handful of trainers in Melbourne qualified to work with dogs on behaviour medication protocols.',
  'PhD-qualified behaviourist for complex cases including aggression and anxiety.',
  'Behaviour assessment: $250 | Modification program: $200/session | Vet liaison service: $100',
  NULL,
  'verified',
  'behaviour_consultant',
  15,
  ARRAY['PhD Animal Behaviour', 'AVSAB Diplomate', 'Delta Institute Senior'],
  ARRAY['English', 'Vietnamese'],
  true,
  20,
  true,
  true,
  false,
  4.78,
  34,
  4
),
(
  'Brunswick Bark & Train',
  'brunswick-bark-and-train',
  '0456 789 012',
  'woof@brunswickbark.com.au',
  'https://brunswickbark.com.au',
  '155 Sydney Road, Brunswick VIC 3056',
  (SELECT id FROM suburbs WHERE name = 'Brunswick'),
  'Tom and Kate O''Brien run Brunswick''s favourite dog training team. Their approach combines positive reinforcement with practical, everyday exercises that fit into busy lifestyles. They''re particularly known for their popular ''Sunday Social'' group walks and their adolescent dog survival course, which has saved many teenage dogs from being surrendered. The husband-and-wife team brings complementary skills - Tom handles the reactive dogs, while Kate specialises in puppies.',
  'Husband-and-wife training team known for practical, lifestyle-friendly methods.',
  'Puppy social: $30 | Teenage survival course (6 weeks): $420 | Reactive dog program: $550',
  NULL,
  'verified',
  'trainer',
  6,
  ARRAY['Certificate IV Companion Animal Services', 'PPGA Certified'],
  ARRAY['English'],
  true,
  10,
  true,
  true,
  false,
  4.88,
  56,
  2
),
(
  'Northside Canine Academy',
  'northside-canine-academy',
  '0467 890 123',
  'learn@northsidecanine.com.au',
  'https://northsidecanine.com.au',
  '42 High Street, Northcote VIC 3070',
  (SELECT id FROM suburbs WHERE name = 'Northcote'),
  'Priya Sharma brings a unique background in veterinary nursing to her dog training practice. Having worked in emergency veterinary clinics for 5 years before becoming a trainer, she has a deep understanding of the medical side of behaviour. Priya specialises in fearful dogs and those recovering from trauma, using a slow, systematic desensitisation approach that prioritises the dog''s emotional wellbeing above all else.',
  'Ex-vet nurse turned trainer specialising in fearful and traumatised dogs.',
  'Fear assessment: $200 | Desensitisation program: $160/session | Group confidence class: $40',
  NULL,
  'verified',
  'trainer',
  5,
  ARRAY['Vet Nurse Certificate', 'Delta Cert IV', 'Fear Free Certified'],
  ARRAY['English', 'Hindi'],
  true,
  15,
  true,
  true,
  false,
  4.91,
  38,
  3
),
(
  'Eastern Suburbs Dog Whisperer',
  'eastern-suburbs-dog-whisperer',
  '0478 901 234',
  'info@easternsuburbsdogs.com.au',
  'https://easternsuburbsdogs.com.au',
  '8 Glenferrie Road, Hawthorn VIC 3122',
  (SELECT id FROM suburbs WHERE name = 'Hawthorn'),
  'Michael Thompson has been training dogs in Melbourne''s eastern suburbs for over 20 years. A former police dog handler, Michael brings unmatched experience in obedience and recall training. He''s adapted his skills for family pets and is especially effective with strong-willed breeds like German Shepherds, Rottweilers, and Belgian Malinois. His Boot Camp program is legendary among local dog owners.',
  'Former police dog handler with 20 years experience in obedience and recall.',
  'Private session: $170 | 4-week Boot Camp: $650 | Group obedience: $45/class',
  NULL,
  'verified',
  'trainer',
  20,
  ARRAY['Police Dog Handler Cert', 'NDTF Master Trainer', 'Delta Institute'],
  ARRAY['English'],
  false,
  0,
  true,
  true,
  false,
  4.73,
  72,
  6
),
(
  'Rescue Ready Dog Training',
  'rescue-ready-dog-training',
  '0489 012 345',
  'help@rescueready.com.au',
  'https://rescueready.com.au',
  '30 Station Street, Box Hill VIC 3128',
  (SELECT id FROM suburbs WHERE name = 'Box Hill'),
  'Yuki Tanaka founded Rescue Ready after adopting her own rescue dog and struggling to find appropriate training support. She now dedicates her practice exclusively to rescue and rehomed dogs, understanding the unique challenges they face. Yuki partners with major rescue organisations including The Lost Dogs Home and Lort Smith to provide discounted services. Her 12-week integration program has a 94% success rate.',
  'Dedicated rescue dog specialist with partnerships across Melbourne rescue organisations.',
  'Rescue assessment: $150 | 12-week integration: $780 | Emergency behaviour session: $180',
  NULL,
  'verified',
  'trainer',
  7,
  ARRAY['Delta Cert IV', 'Rescue Dog Specialist Cert', 'RSPCA Partner Trainer'],
  ARRAY['English', 'Japanese'],
  true,
  20,
  true,
  true,
  false,
  4.95,
  41,
  2
),
(
  'Williamstown Walkies & Training',
  'williamstown-walkies-training',
  '0490 123 456',
  'book@williamstownwalkies.com.au',
  'https://williamstownwalkies.com.au',
  '65 Ferguson Street, Williamstown VIC 3016',
  (SELECT id FROM suburbs WHERE name = 'Williamstown'),
  'Zoe Campbell combines professional dog walking with structured training sessions, offering a unique service model for busy professionals. Dogs get exercise, socialisation, and training all in one session. Her beach training sessions at Williamstown Beach are especially popular during summer. Zoe also runs evening group classes for owners who work during the day.',
  'Combined walking and training service ideal for busy professionals.',
  'Walk & Train session: $85 | Evening group class: $35 | Weekend intensive: $280',
  NULL,
  'verified',
  'trainer',
  4,
  ARRAY['Certificate IV Companion Animal Services'],
  ARRAY['English'],
  true,
  12,
  true,
  true,
  false,
  4.67,
  29,
  1
),
(
  'The Dog Psychology Centre Melbourne',
  'dog-psychology-centre-melbourne',
  '0401 234 567',
  'appointments@dogpsychmelb.com.au',
  'https://dogpsychmelb.com.au',
  '100 Heidelberg Road, Heidelberg VIC 3084',
  (SELECT id FROM suburbs WHERE name = 'Heidelberg'),
  'Dr. Andrew Walsh runs Melbourne''s only dedicated dog psychology centre, offering in-depth behaviour assessments and long-term modification programs. With a background in applied animal psychology, Andrew takes a holistic approach that considers the dog''s environment, routine, diet, and human family dynamics. He regularly consults for difficult cases referred by other trainers and veterinarians.',
  'Melbourne''s only dedicated dog psychology centre for complex behavioural cases.',
  'Full psychological assessment: $350 | Ongoing program: $180/session | Trainer referral consult: $250',
  NULL,
  'verified',
  'behaviour_consultant',
  18,
  ARRAY['Masters Applied Animal Psychology', 'AVSAB Member', 'APDT Certified'],
  ARRAY['English'],
  false,
  0,
  true,
  true,
  true,
  4.89,
  25,
  8
),
(
  'Paws in the Park',
  'paws-in-the-park',
  '0412 876 543',
  'info@pawsinpark.com.au',
  'https://pawsinpark.com.au',
  '15 Glenhuntly Road, Bentleigh VIC 3204',
  (SELECT id FROM suburbs WHERE name = 'Bentleigh'),
  'Rachel Kim has built a loyal following in Melbourne''s south-eastern suburbs with her engaging, fun-first approach to dog training. Her park-based group classes are designed to be social events for both dogs and their owners, creating a supportive community. Rachel is particularly skilled with small breeds and anxious dogs, using games and play to build confidence. Her ''Doggy Dates'' program helps dogs with poor social skills learn to interact safely.',
  'Fun-first trainer building a supportive dog community in the south-east.',
  'Park group class: $30 | Doggy Dates program (4 weeks): $320 | Private: $140',
  NULL,
  'verified',
  'trainer',
  6,
  ARRAY['Delta Cert IV', 'Karen Pryor Academy Graduate'],
  ARRAY['English', 'Korean'],
  true,
  15,
  true,
  true,
  false,
  4.82,
  51,
  2
),
(
  'Footscray Canine Coach',
  'footscray-canine-coach',
  '0423 765 432',
  'coach@footscraycanine.com.au',
  'https://footscraycanine.com.au',
  '28 Barkly Street, Footscray VIC 3011',
  (SELECT id FROM suburbs WHERE name = 'Footscray'),
  'Amara Osei brings warmth and cultural sensitivity to dog training in Melbourne''s diverse western suburbs. Having grown up in a culture where dogs were working animals, she bridges the gap between different cultural attitudes to pet ownership. Amara offers sessions in multiple languages and runs a free monthly community workshop for new migrants with dogs. Her accessible pricing makes professional training available to everyone.',
  'Culturally inclusive trainer bridging diverse communities in Melbourne''s west.',
  'Private session: $100 | Community workshop: FREE | 6-week basics course: $300',
  NULL,
  'verified',
  'trainer',
  5,
  ARRAY['Certificate IV Companion Animal Services', 'Community Engagement Certificate'],
  ARRAY['English', 'French', 'Twi'],
  true,
  15,
  true,
  true,
  false,
  4.94,
  33,
  1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- TRAINER SERVICES
-- ============================================
-- Pawsitive Behaviours
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'behaviour_consultations', true, 120, 180),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'puppy_training', false, 450, 450),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'private_training', false, 120, 180);

-- Melbourne Inner City
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'group_classes', true, 35, 35),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'private_training', false, 150, 150),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'obedience_training', false, 380, 380);

-- Southside Pups
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'puppy_training', true, 520, 520),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'group_classes', false, 480, 480),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'private_training', false, 160, 160);

-- Bay City Behaviour
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'behaviour_consultations', true, 200, 250),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'private_training', false, 200, 200);

-- Brunswick Bark
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'puppy_training', true, 30, 30),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'group_classes', false, 420, 420),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'private_training', false, 550, 550);

-- Northside Canine
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'behaviour_consultations', true, 160, 200),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'group_classes', false, 40, 40),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'private_training', false, 160, 160);

-- Eastern Suburbs
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'obedience_training', true, 650, 650),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'group_classes', false, 45, 45),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'private_training', false, 170, 170);

-- Rescue Ready
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'behaviour_consultations', true, 150, 180),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'private_training', false, 780, 780);

-- Williamstown Walkies
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'private_training', true, 85, 85),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'group_classes', false, 35, 35);

-- Dog Psychology Centre
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'behaviour_consultations', true, 180, 350),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'private_training', false, 180, 180);

-- Paws in the Park
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'group_classes', true, 30, 30),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'private_training', false, 140, 140),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'puppy_training', false, 320, 320);

-- Footscray Canine Coach
INSERT INTO trainer_services (business_id, service_type, is_primary, price_from, price_to) VALUES
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'group_classes', true, 0, 0),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'private_training', false, 100, 100),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'obedience_training', false, 300, 300);

-- ============================================
-- TRAINER SPECIALIZATIONS
-- ============================================
INSERT INTO trainer_specializations (business_id, age_specialty) VALUES
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'rescue_dogs'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'senior_7y_plus'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'rescue_dogs'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'rescue_dogs'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'rescue_dogs'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'senior_7y_plus'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'rescue_dogs'),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'adolescent_6_18m'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'puppies_0_6m'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'adult_18m_7y'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'rescue_dogs');

-- ============================================
-- TRAINER BEHAVIOR ISSUES
-- ============================================
INSERT INTO trainer_behavior_issues (business_id, behavior_issue) VALUES
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'separation_anxiety'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'anxiety_general'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'rescue_dog_support'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'destructive_behaviour'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'leash_reactivity'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'separation_anxiety'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'pulling_on_lead'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'socialisation'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'mouthing_nipping_biting'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'jumping_up'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'socialisation'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'dog_aggression'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'resource_guarding'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'anxiety_general'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'pulling_on_lead'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'recall_issues'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'leash_reactivity'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'socialisation'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'anxiety_general'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'rescue_dog_support'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'excessive_barking'),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'recall_issues'),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'pulling_on_lead'),
  ((SELECT id FROM businesses WHERE slug = 'eastern-suburbs-dog-whisperer'), 'jumping_up'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'rescue_dog_support'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'anxiety_general'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'dog_aggression'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'separation_anxiety'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'pulling_on_lead'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'socialisation'),
  ((SELECT id FROM businesses WHERE slug = 'williamstown-walkies-training'), 'recall_issues'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'dog_aggression'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'resource_guarding'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'separation_anxiety'),
  ((SELECT id FROM businesses WHERE slug = 'dog-psychology-centre-melbourne'), 'destructive_behaviour'),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'socialisation'),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'anxiety_general'),
  ((SELECT id FROM businesses WHERE slug = 'paws-in-the-park'), 'jumping_up'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'pulling_on_lead'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'recall_issues'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'rescue_dog_support'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'socialisation');

-- ============================================
-- REVIEWS
-- ============================================
INSERT INTO reviews (business_id, reviewer_name, rating, title, content, is_approved, created_at) VALUES
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'Hannah M.', 5, 'Transformed our anxious rescue', 'Sarah completely transformed our rescue greyhound. After 3 sessions, Luna was walking calmly on lead and sleeping through the night. Cannot recommend highly enough.', true, '2025-11-15'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'David L.', 5, 'Science-based and effective', 'Finally a trainer who explains the WHY behind everything. Sarah''s approach is methodical and the results speak for themselves.', true, '2025-10-22'),
  ((SELECT id FROM businesses WHERE slug = 'pawsitive-behaviours-melbourne'), 'Jennifer K.', 5, 'Best puppy program in Melbourne', 'Our golden retriever puppy graduated from the 6-week program with perfect recall and loose-lead walking. Worth every cent.', true, '2025-09-08'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'Sophie T.', 5, 'Perfect for apartment dogs', 'James understood our apartment challenges instantly. His urban training tips have made city living so much easier for us and Cooper.', true, '2025-12-01'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'Mark R.', 5, 'Saturday groups are amazing', 'Edinburgh Gardens group classes are the highlight of our week. Great socialisation and training in one.', true, '2025-11-18'),
  ((SELECT id FROM businesses WHERE slug = 'melbourne-inner-city-dog-training'), 'Aisha N.', 4, 'Great for reactive dogs', 'James helped our reactive kelpie enormously. She''s not perfect but so much better. Wish he had more evening availability.', true, '2025-10-05'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'Rebecca W.', 5, 'The gold standard for puppies', 'Emma is an absolute gem. Her 8-week program gave us all the skills and confidence we needed as first-time puppy owners.', true, '2025-12-10'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'Chris P.', 5, 'Purpose-built facilities are amazing', 'Rain or shine, training goes ahead in Emma''s indoor facility. Our cavoodle loved every single session.', true, '2025-11-25'),
  ((SELECT id FROM businesses WHERE slug = 'southside-pups-academy'), 'Lily Z.', 5, 'Third puppy with Emma', 'We''ve now brought all three of our dogs to Southside Pups. Consistently excellent across 6 years. A Melbourne institution.', true, '2025-09-30'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'Michael S.', 5, 'Handled our complex case brilliantly', 'After being turned away by two other trainers, Lisa took on our dog-aggressive staffy. Six months later, we can walk past other dogs calmly.', true, '2025-11-02'),
  ((SELECT id FROM businesses WHERE slug = 'bay-city-behaviour'), 'Karen D.', 5, 'Worth the premium price', 'Lisa''s clinical approach and vet liaison service was exactly what we needed for our anxious border collie on medication.', true, '2025-10-15'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'Alex G.', 5, 'Saved our teenage dog', 'Our labradoodle was a nightmare at 10 months. Tom and Kate''s adolescent course literally saved him from being rehomed. Forever grateful.', true, '2025-12-05'),
  ((SELECT id FROM businesses WHERE slug = 'brunswick-bark-and-train'), 'Nina F.', 5, 'Sunday Socials are brilliant', 'The community walks are such a lovely idea. Our dog has made friends and so have we! Great for socialisation.', true, '2025-11-20'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'Daniel B.', 5, 'Gentle and effective', 'Priya''s background in vet nursing really shows. She understood our fearful dog''s body language better than anyone we''d worked with.', true, '2025-11-28'),
  ((SELECT id FROM businesses WHERE slug = 'northside-canine-academy'), 'Grace H.', 5, 'Patience of a saint', 'Our severely traumatised rescue took weeks to even approach Priya, and she never rushed the process. True professional.', true, '2025-10-12'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'Olivia M.', 5, 'The rescue dog expert', 'Yuki is the only trainer I''d recommend for rescue dogs. Her understanding of their unique challenges is unmatched in Melbourne.', true, '2025-12-08'),
  ((SELECT id FROM businesses WHERE slug = 'rescue-ready-dog-training'), 'Sam J.', 5, '94% success rate is real', 'Our rescue was a mess when we adopted him. 12 weeks with Yuki and he''s a different dog. She''s incredible.', true, '2025-11-10'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'Fatima A.', 5, 'Made training accessible', 'As a new migrant, Amara''s cultural sensitivity and free workshops meant the world. Our dog is so much better behaved now.', true, '2025-12-02'),
  ((SELECT id FROM businesses WHERE slug = 'footscray-canine-coach'), 'James O.', 5, 'Community champion', 'Amara does incredible work in Footscray. Affordable, effective, and genuinely caring about the community. A real asset to the west.', true, '2025-11-08');

-- ============================================
-- EMERGENCY RESOURCES
-- ============================================
INSERT INTO emergency_resources (name, resource_type, phone, email, website, address, suburb_id, is_24_hour, emergency_hours, emergency_services, cost_indicator, is_active) VALUES
(
  'University of Melbourne Veterinary Hospital',
  'emergency_vet',
  '03 9731 2000',
  'emergency@unimelb.edu.au',
  'https://vet.unimelb.edu.au',
  '250 Princes Highway, Werribee VIC 3030',
  NULL,
  true,
  '24/7 Emergency',
  ARRAY['Emergency surgery', 'Critical care', 'Poison treatment', 'Trauma'],
  '$$$',
  true
),
(
  'Animal Emergency Centre Hallam',
  'emergency_vet',
  '03 9796 6199',
  NULL,
  'https://animalemergency.com.au',
  '2 Claredale Road, Hallam VIC 3803',
  NULL,
  true,
  '24/7 Emergency',
  ARRAY['Emergency surgery', 'After-hours care', 'Critical care'],
  '$$$',
  true
),
(
  'Lort Smith Animal Hospital',
  'urgent_care',
  '03 9328 3021',
  'info@lortsmith.com',
  'https://lortsmith.com',
  '24 Villiers Street, North Melbourne VIC 3051',
  NULL,
  false,
  'Mon-Fri 8am-8pm, Sat-Sun 9am-5pm',
  ARRAY['Urgent consultations', 'Affordable care', 'Desexing', 'Vaccinations'],
  '$',
  true
),
(
  'Lost Dogs Home',
  'emergency_shelter',
  '03 9329 2755',
  'info@dogshome.com',
  'https://dogshome.com',
  '2 Gracie Street, North Melbourne VIC 3051',
  NULL,
  false,
  'Mon-Sun 10am-4pm',
  ARRAY['Lost dog registration', 'Emergency shelter', 'Rehoming', 'Microchipping'],
  'Free',
  true
),
(
  'RSPCA Victoria',
  'emergency_shelter',
  '03 9224 2222',
  NULL,
  'https://rspcavic.org',
  '3 Burwood Highway, Burwood East VIC 3151',
  NULL,
  false,
  'Mon-Sun 10am-6pm',
  ARRAY['Animal rescue', 'Emergency shelter', 'Cruelty reporting', 'Rehoming'],
  'Free',
  true
);
