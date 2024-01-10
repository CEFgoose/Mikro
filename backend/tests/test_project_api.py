import pytest
from ..app import app
from flask import g
from ..api.database import (
    Project,
    User,
    db,
)
from ..api.static_variables import (
    POSTGRES_DB,
    POSTGRES_ENDPOINT,
    POSTGRES_PASSWORD,
    POSTGRES_PORT,
    POSTGRES_USER,
)

# CONSTANTS FOR IMPORTS
CREATE_PROJECT_ENDPOINT = "/api/project/create_project"
DELETE_PROJECT_ENDPOINT = "/api/project/delete_project"
CALCULATE_BUDGET_ENDPOINT = "/api/project/calculate_budget"

# DATA FOR TESTS
data_with_all_required_args = {
    "url": "https://tasks.kaart.com/projects/167",
    "rate_type": True,
    "mapping_rate": float(0.5),
    "validation_rate": float(0.3),
    "max_editors": 10,
    "max_validators": 5,
    "visibility": True,
}

# GENERIC ADMIN USER
admin = User(
    deleted_date=None,
    id=28,
    email="devin.markley@kaart.com",
    payment_email="asdf2s@af.com",
    city="asdf",
    country="asdf",
    osm_username="sadf",
    org_id=1,
    first_name="devin",
    last_name="markley",
    create_time="2023-12-18 13:47:33.591857",
    role="admin",
    assigned_projects=None,
    assigned_checklists=None,
    mapper_level=0,
    mapper_points=5,
    validator_points=0,
    special_project_points=0,
    validation_payable_total=0,
    mapping_payable_total=0,
    checklist_payable_total=0.01,
    payable_total=0,
    requested_total=0,
    paid_total=0,
    total_tasks_mapped=0,
    total_tasks_validated=0,
    total_tasks_invalidated=0,
    total_checklists_completed=0,
    validator_total_checklists_confirmed=0,
    validator_tasks_invalidated=0,
    validator_tasks_validated=0,
    requesting_payment=False,
)


def set_g_user():
    user = User.query.filter_by(role="admin").first()
    if user:
        g.user = user
    else:
        g.user = admin


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "postgresql://"
        + POSTGRES_USER
        + ":"
        + POSTGRES_PASSWORD
        + "@"
        + POSTGRES_ENDPOINT
        + ":"
        + POSTGRES_PORT
        + "/"
        + POSTGRES_DB
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    with app.test_request_context():
        # Begin a nested transaction
        db.session.begin_nested()
        db.session.add(admin)
        set_g_user()

        with app.test_client() as client:
            yield client


def get_project_id(url):
    # Remove trailing slash and then split
    url_parts = url.rstrip("/").split("/")
    project_id = url_parts[-1]
    return project_id


"""

create_project testing

"""


def test_create_project_with_all_required_args(client):
    """
    This test passes all the required args and should create a project.
    """
    result = client.post(CREATE_PROJECT_ENDPOINT, json=data_with_all_required_args)
    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 200
    """
    This test passes all the required args and should create a project then a redundant project.
    """
    result = client.post(CREATE_PROJECT_ENDPOINT, json=data_with_all_required_args)
    response_json = result.json
    status_code = response_json.get("status")
    assert status_code == 400


def test_create_project_with_missing_args(client):
    """
    This test loops through all the required args removing one
    and then sending a request to check that the function is ensuring
    all the required arguments are present.
    """
    for arg_name in data_with_all_required_args:
        modified_args = data_with_all_required_args.copy()
        del modified_args[arg_name]
        result = client.post(CREATE_PROJECT_ENDPOINT, json=modified_args)
        response_json = result.json
        status_code = response_json.get("status")
        assert status_code == 400


def test_create_project_without_org_id(client):
    """
    This test passes all the required args but not the org_id of the user.
    """
    g.user = None
    result = client.post(CREATE_PROJECT_ENDPOINT, json=data_with_all_required_args)
    response_json = result.json
    status_code = response_json.get("status")
    assert status_code == 304


def test_create_project_without_id_in_url(client):
    """
    This test passes all the required args but not the project_id in the url
    """
    modified_args = data_with_all_required_args.copy()
    modified_args["url"] = "https://tasks.kaart.com/projects/"
    result = client.post(CREATE_PROJECT_ENDPOINT, json=modified_args)
    response_json = result.json
    status_code = response_json.get("status")
    assert status_code == 400


"""

delete_project testing

"""


def test_delete_project_that_doesnt_exist(client):
    """
    Attempts to delte a project that doesn't exist
    """
    project_id = {"project_id": 1000000}
    result = client.post(DELETE_PROJECT_ENDPOINT, json=project_id)

    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 400


def test_delete_project_without_org_id(client):
    """
    This test passes all the required args but not the org_id of the user.
    """
    g.user = None
    project_id = {"project_id": 1000000}
    result = client.post(DELETE_PROJECT_ENDPOINT, json=project_id)

    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 304


# def test_delete_project(client):
#     """
#     Creates a project and then deletes it
#     """

#     client.post(CREATE_PROJECT_ENDPOINT, json=data_with_all_required_args)
#     url_id = get_project_id(data_with_all_required_args["url"])
#     project_id = {"project_id": url_id}
#     result = client.post(DELETE_PROJECT_ENDPOINT, json=project_id)

#     response_json = result.json
#     print(response_json)
#     status_code = response_json.get("status")
#     assert status_code == 200


def test_delete_project_without_project_id(client):
    """
    Attempts to delete a project it without a valid project_id
    """
    project_id = {"project_id": ""}
    result = client.post(DELETE_PROJECT_ENDPOINT, json=project_id)
    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 400


"""

calculate_budget testing

"""


def test_calculate_budget_without_org_id(client):
    """
    This test attempts to calculate the budget with an org_id
    """
    g.user = None
    result = client.post(CALCULATE_BUDGET_ENDPOINT)
    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 304


def test_calculate_budget_with_missing_args(client):
    """
    This test loops through all the required args removing one
    and then sending a request to check that the function is ensuring
    all the required arguments are present.
    """
    calculate_budget_required_args = {
        "url": "https://tasks.kaart.com/projects/167",
        "rate_type": True,
        "mapping_rate": float(0.5),
        "validation_rate": float(0.3),
        "max_editors": 10,
        "max_validators": 5,
        "visibility": True,
    }
    for arg_name in calculate_budget_required_args:
        modified_args = calculate_budget_required_args.copy()
        del modified_args[arg_name]
        result = client.post(CALCULATE_BUDGET_ENDPOINT, json=modified_args)
        response_json = result.json
        status_code = response_json.get("status")
        assert status_code == 400


def test_calculate_budget_with_required_args(client):
    # Create the projet to calculate
    client.post(CREATE_PROJECT_ENDPOINT, json=data_with_all_required_args)

    # Get the project id from the general required args
    url_id = get_project_id(data_with_all_required_args["url"])

    # append project_id to the list to mett all the required args
    calculate_budget_args = data_with_all_required_args.copy()
    calculate_budget_args["project_id"] = url_id

    result = client.post(CALCULATE_BUDGET_ENDPOINT, json=calculate_budget_args)
    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 200


def test_calculate_budget_with_nonexistent_project(client):
    # Get the project id from the general required args
    url_id = get_project_id(data_with_all_required_args["url"])

    # append project_id to the list to mett all the required args
    calculate_budget_args = data_with_all_required_args.copy()
    calculate_budget_args["project_id"] = url_id

    result = client.post(CALCULATE_BUDGET_ENDPOINT, json=calculate_budget_args)
    response_json = result.json
    print(response_json)
    status_code = response_json.get("status")
    assert status_code == 400
