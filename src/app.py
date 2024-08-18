# app.py
import dash
from dash import html, dcc
from dash.dependencies import Input, Output
import dash_bootstrap_components as dbc

# Import layouts and callbacks from other files
from home import home_layout, register_home_callbacks
from song_analysis import song_analysis_layout, register_song_analysis_callbacks
from tour_exploration import tour_exploration_layout, register_tour_exploration_callbacks

# Initialize the Dash app
app = dash.Dash(__name__, external_stylesheets=[
    dbc.themes.DARKLY,
    'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;700&display=swap'
], suppress_callback_exceptions=True)
server = app.server
# Custom CSS for the navbar
navbar_style = {
    'fontFamily': 'Barlow Condensed, sans-serif',
    'fontWeight': 'bold',
    'fontSize': '1.4rem',
}

# Custom CSS for the brand name
brand_style = {
    'fontFamily': 'Barlow Condensed, sans-serif',
    'fontWeight': 'bold',
    'fontSize': '1.8rem',
}

# Define the navbar
navbar = dbc.Navbar(
    dbc.Container(
        [
            html.A(
                dbc.Row(
                    dbc.Col(dbc.NavbarBrand("THE ROLLING STONES", className="ms-2", style=brand_style)),
                    align="center",
                    className="g-0",
                ),
                href="/",
                style={"textDecoration": "none"},
            ),
            dbc.NavbarToggler(id="navbar-toggler", n_clicks=0),
            dbc.Collapse(
                dbc.Nav(
                    [
                        dbc.NavItem(dbc.NavLink("Home", href="/", style=navbar_style)),
                        dbc.NavItem(dbc.NavLink("Song Analysis", href="/song-analysis", style=navbar_style)),
                        dbc.NavItem(dbc.NavLink("Tour Exploration", href="/tour-exploration", style=navbar_style)),
                    ],
                    className="ms-auto",
                    navbar=True,
                ),
                id="navbar-collapse",
                navbar=True,
            ),
        ]
    ),
    color="dark",
    dark=True,
)

# Define the layout
app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    navbar,
    html.Div(id='page-content')
])

# Update page content based on URL
@app.callback(Output('page-content', 'children'),
              [Input('url', 'pathname')])
def display_page(pathname):
    if pathname == '/song-analysis':
        return song_analysis_layout
    elif pathname == '/tour-exploration':
        return tour_exploration_layout
    else:
        return home_layout

# Register callbacks from other modules
register_home_callbacks(app)
register_song_analysis_callbacks(app)
register_tour_exploration_callbacks(app)

# Run the app
if __name__ == '__main__':
    app.run_server(debug=True)