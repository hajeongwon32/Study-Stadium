import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ueoioaxyscivdcoaskwc.supabase.co';
const supabaseAnonKey = 'sb_publishable_FxBX_J_mGwA8ks42aQRomA_i8pr2hfR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);