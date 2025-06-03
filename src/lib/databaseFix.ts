import { supabase } from './supabase';

// Alternative approach using direct table operations
export const fixAuthenticationDirectly = async (): Promise<boolean> => {
  try {
    console.log('Attempting direct authentication fix...');

    // First try to get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      return false;
    }

    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    console.log('Current user email:', user.email);

    // Get admin role ID
    const { data: adminRole, error: adminRoleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (adminRoleError) {
      console.error('Error fetching admin role:', adminRoleError);
      return false;
    }

    if (!adminRole) {
      console.error('Admin role not found');
      return false;
    }

    console.log('Admin role ID:', adminRole.id);

    // Try to manually assign admin role using upsert
    const { error: manualAssignError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role_id: adminRole.id
      }, {
        onConflict: 'user_id,role_id'
      });

    if (manualAssignError) {
      console.error('Error manually assigning admin role:', manualAssignError);
      // Continue anyway, might be a constraint issue
    } else {
      console.log('Admin role assigned manually');
    }

    // Update user metadata via auth
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { is_admin: true }
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Continue anyway
    } else {
      console.log('User metadata updated');
    }

    return true;

  } catch (error) {
    console.error('Direct authentication fix failed:', error);
    return false;
  }
};

// Simple function to just try assigning current user admin role
export const assignCurrentUserAdminRole = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get admin role
    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (!adminRole) return false;

    // Insert admin role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_id: adminRole.id
      });

    if (error && !error.message.includes('duplicate key')) {
      console.error('Error assigning admin role:', error);
      return false;
    }

    // Update metadata
    await supabase.auth.updateUser({
      data: { is_admin: true }
    });

    return true;
  } catch (error) {
    console.error('Error in assignCurrentUserAdminRole:', error);
    return false;
  }
}; 