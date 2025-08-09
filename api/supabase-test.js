module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // First, check if we can import Supabase
      console.log('🔧 Attempting to import Supabase...');
      
      let supabaseImportError = null;
      let createClient = null;
      
      try {
        const supabaseLib = require('@supabase/supabase-js');
        createClient = supabaseLib.createClient;
        console.log('✅ Supabase import successful');
      } catch (importError) {
        supabaseImportError = importError;
        console.error('❌ Supabase import failed:', importError);
      }

      // Check environment variables
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      console.log('🔧 Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlStart: supabaseUrl?.substring(0, 30),
        keyStart: supabaseKey?.substring(0, 20)
      });

      const testResult = {
        success: true,
        timestamp: new Date().toISOString(),
        tests: {
          supabaseImport: {
            success: !supabaseImportError,
            error: supabaseImportError?.message || null
          },
          environmentVars: {
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseKey,
            supabaseUrlValid: supabaseUrl?.includes('supabase.co') || false
          }
        }
      };

      // Try to create client if import succeeded
      if (createClient && supabaseUrl && supabaseKey) {
        try {
          console.log('🔧 Attempting to create Supabase client...');
          const supabase = createClient(supabaseUrl, supabaseKey);
          testResult.tests.clientCreation = { success: true };
          console.log('✅ Supabase client created successfully');
          
          // Try a simple query
          try {
            console.log('🔧 Attempting simple Supabase query...');
            const { data, error } = await supabase
              .from('dishes')
              .select('count')
              .limit(1);
              
            testResult.tests.simpleQuery = {
              success: !error,
              error: error?.message || null,
              dataReceived: !!data
            };
            
            if (error) {
              console.error('❌ Supabase query failed:', error);
            } else {
              console.log('✅ Supabase query successful');
            }
          } catch (queryError) {
            testResult.tests.simpleQuery = {
              success: false,
              error: queryError.message
            };
            console.error('❌ Supabase query exception:', queryError);
          }
        } catch (clientError) {
          testResult.tests.clientCreation = {
            success: false,
            error: clientError.message
          };
          console.error('❌ Supabase client creation failed:', clientError);
        }
      } else {
        testResult.tests.clientCreation = {
          success: false,
          error: 'Missing requirements for client creation'
        };
      }

      res.status(200).json(testResult);
    } catch (error) {
      console.error('❌ Supabase test error:', error);
      res.status(500).json({ 
        error: 'Supabase test failed',
        details: error.message,
        stack: error.stack
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
