// 🔥 CRITICAL FIX for file upload schema validation error
// This fixes the "Cast to [string] failed" error that deletes AI responses

// Add this code to your streamMessage function in aiController.js 
// RIGHT BEFORE the conversation.save() call (around line 570):

// 🔥 CRITICAL: Fix files structure before saving
console.log('🔧 FIXING FILES STRUCTURE FOR DATABASE...');

// Ensure files in user message are properly structured
conversation.messages.forEach((msg, index) => {
  if (msg.files && msg.files.length > 0) {
    console.log(`Fixing files for message ${index}:`, msg.files);
    
    // Ensure files is an array of proper objects
    msg.files = msg.files.map(file => {
      // Handle stringified files
      let fileObj = file;
      if (typeof file === 'string') {
        try {
          fileObj = JSON.parse(file);
        } catch (e) {
          console.error('Failed to parse file:', file);
          return null;
        }
      }
      
      // Return properly typed object
      return {
        name: String(fileObj.name || 'unknown'),
        type: String(fileObj.type || 'application/octet-stream'),
        url: String(fileObj.url || ''),
        size: Number(fileObj.size || 0)
      };
    }).filter(Boolean);
    
    console.log(`✅ Fixed files for message ${index}:`, msg.files);
  }
});

// Also add this AFTER the conversation.save() call for extra safety:

console.log('✅ Conversation saved with proper file structure');

// This prevents the error:
// "Cast to [string] failed for value" in the files.0 path 