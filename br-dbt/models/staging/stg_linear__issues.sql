with src as (
  select
    id::string as issue_id,
    number::number as issue_number,
    team_key::string as team_key,
    team_name::string as team_name,
    project_name::string as project_name,
    title::string as title,
    state::string as state,
    try_to_number(priority) as priority,
    try_to_number(estimate) as estimate,
    try_parse_json(labels) as labels,
    assignee::string as assignee,
    to_timestamp_ntz(created_at) as created_at,
    to_timestamp_ntz(updated_at)  as updated_at,
    to_timestamp_ntz(completed_at) as completed_at
  from BR_RAW.APP.RAW_LINEAR_ISSUES
)
select * from src;
