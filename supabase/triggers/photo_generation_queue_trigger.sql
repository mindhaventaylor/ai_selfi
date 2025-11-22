-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS photo_job_trigger ON photo_generation_queue;
DROP FUNCTION IF EXISTS notify_photo_job();

-- Create function that emits pg_notify
CREATE OR REPLACE FUNCTION notify_photo_job() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  -- Emit notification with the full job row as JSON
  PERFORM pg_notify(
    'photo_generation_queue_channel',
    row_to_json(NEW)::text
  );
  
  -- Log for debugging (only in development)
  RAISE NOTICE 'Trigger fired for job ID: %', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires on INSERT
CREATE TRIGGER photo_job_trigger
  AFTER INSERT ON photo_generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION notify_photo_job();

-- Verify trigger was created
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'photo_job_trigger';

