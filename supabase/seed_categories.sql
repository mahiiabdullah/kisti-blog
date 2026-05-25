DO $$
DECLARE
  cat_islam_adhunikota uuid;
  cat_shariah_fiqh uuid;
  cat_political_islam uuid;
  cat_history uuid;
  cat_theory uuid;
  cat_bangladesh uuid;
  cat_books uuid;
BEGIN
  -- Insert Main Categories
  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('ইসলাম ও আধুনিকতা', true, 1, 'islam-o-adhunikota') RETURNING id INTO cat_islam_adhunikota;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('শরিয়া ও ফিকহ', true, 2, 'shariah-o-fiqh') RETURNING id INTO cat_shariah_fiqh;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('রাজনৈতিক ইসলাম', true, 3, 'rajnoitik-islam') RETURNING id INTO cat_political_islam;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('ইতিহাস ও সভ্যতা', true, 4, 'itihas-o-sovyota') RETURNING id INTO cat_history;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('তত্ত্ব ও দর্শন', true, 5, 'totto-o-dorshon') RETURNING id INTO cat_theory;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('বাংলাদেশ প্রসঙ্গ', true, 6, 'bangladesh-proshongo') RETURNING id INTO cat_bangladesh;

  INSERT INTO public.categories (name_bn, is_main, position, slug)
  VALUES ('গ্রন্থালোচনা', true, 7, 'gronthalochona') RETURNING id INTO cat_books;

  -- Insert Subcategories for ইসলাম ও আধুনিকতা
  INSERT INTO public.categories (name_bn, parent_id, position, slug)
  VALUES 
    ('সেক্যুলারিজম ও ধর্ম', cat_islam_adhunikota, 1, 'secularism-o-dhormo'),
    ('উত্তর-আধুনিকতা', cat_islam_adhunikota, 2, 'uttor-adhunikota'),
    ('মুসলিম আধুনিকতাবাদ', cat_islam_adhunikota, 3, 'muslim-adhunikotabad'),
    ('ইসলামি পুনরুজ্জীবন', cat_islam_adhunikota, 4, 'islami-punorujjibon');

  -- Insert Subcategories for শরিয়া ও ফিকহ
  INSERT INTO public.categories (name_bn, parent_id, position, slug)
  VALUES 
    ('উসুলুল ফিকহ', cat_shariah_fiqh, 1, 'usulul-fiqh'),
    ('সমসাময়িক মাসায়েল', cat_shariah_fiqh, 2, 'somosamoyik-masayel'),
    ('মাকাসিদ আশ-শরিয়া', cat_shariah_fiqh, 3, 'maqasid-ash-shariah'),
    ('তুলনামূলক ফিকহ', cat_shariah_fiqh, 4, 'tulonamulok-fiqh');

  -- Insert Subcategories for রাজনৈতিক ইসলাম
  INSERT INTO public.categories (name_bn, parent_id, position, slug)
  VALUES 
    ('খেলাফত ও রাষ্ট্রতত্ত্ব', cat_political_islam, 1, 'khelafat-o-rashtrototto'),
    ('গণতন্ত্র ও ইসলাম', cat_political_islam, 2, 'gonotontro-o-islam'),
    ('ইসলামী আন্দোলন', cat_political_islam, 3, 'islami-andolon');

END $$;
