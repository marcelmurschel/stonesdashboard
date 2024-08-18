# song_analysis.py
from dash import html, dcc, Input, Output, State
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.graph_objs as go
import numpy as np

# Load the data
df = pd.read_csv('2024_rollingstones_tourdata.csv')

# Function to get all unique songs from setlists
def get_all_songs(df):
    all_songs = set()
    for setlist in df['setlist'].dropna():
        songs = eval(setlist)
        all_songs.update(songs)
    return sorted(list(all_songs))

all_songs = get_all_songs(df)

# Normalize position to a 20-song setlist
def normalize_position(position, setlist_length):
    return round((position / setlist_length) * 20)

# Song Analysis layout
song_analysis_layout = html.Div([
    html.Div([
        html.Div([
            html.H1("THE ROLLING STONES", 
                    style={
                        'fontFamily': 'Barlow Condensed, sans-serif',
                        'fontWeight': 'bold',
                        'color': 'white',
                        'textAlign': 'center',
                        'fontSize': '5rem',
                        'marginBottom': '0',
                        'paddingTop': '20px',
                    }),
            
            html.H2("Song Analysis",
                    style={
                        'fontFamily': 'Barlow Condensed, sans-serif',
                        'fontWeight': 'normal',
                        'color': '#FF4136',
                        'textAlign': 'center',
                        'marginTop': '5px',
                        'marginBottom': '40px',
                        'fontSize': '2.2rem'
                    }),
            
            dbc.Row([
                dbc.Col([
                    html.Label("Select a Song", style={'color': 'white', 'fontSize': '1.2rem', 'marginBottom': '10px', 'fontWeight': 'bold'}),
                    dcc.Dropdown(
                        id='song-dropdown',
                        options=[{'label': song, 'value': song} for song in all_songs],
                        value=all_songs[0] if all_songs else None,
                        style={'backgroundColor': '#303030', 'color': 'black'}
                    ),
                ], width=6, className="mb-4"),
            ], justify="center"),
            
            dbc.Row([
                dbc.Col([
                    dcc.Graph(id='song-position-chart')
                ], width=12)
            ], justify="center")
            
        ], style={
            'backgroundColor': 'black',
            'borderRadius': '30px',
            'padding': '40px',
            'boxShadow': '0 6px 12px 0 rgba(0, 0, 0, 0.2)',
            'minHeight': '90vh',
        }),
    ], style={
        'width': '95%',
        'maxWidth': '1600px',
        'margin': '0 auto',
        'padding': '20px',
    }),
], style={
    'backgroundColor': '#1a1a1a',
    'minHeight': '100vh',
    'fontFamily': 'Barlow Condensed, sans-serif',
})

def register_song_analysis_callbacks(app):
    @app.callback(
        [Output('song-position-chart', 'figure'),
         Output('song-dropdown', 'value')],
        [Input('song-dropdown', 'value')],
        [State('song-dropdown', 'value')]
    )
    def update_song_position_chart(selected_song, current_value):
        if not selected_song:
            return go.Figure(), current_value  # Return an empty chart and maintain current value if no song is selected

        normalized_positions = []
        for setlist in df['setlist'].dropna():
            songs = eval(setlist)
            if selected_song in songs:
                position = songs.index(selected_song) + 1
                setlist_length = len(songs)
                normalized_position = normalize_position(position, setlist_length)
                normalized_positions.append(normalized_position)

        position_counts = pd.Series(normalized_positions).value_counts().sort_index()

        # Create a full range of positions from 1 to 20
        full_range = pd.Series(range(1, 21))
        position_counts = position_counts.reindex(full_range, fill_value=0)

        # Convert to percentages
        total = position_counts.sum()
        position_percentages = (position_counts / total * 100).round(2)

        # Create the figure
        fig = go.Figure()

        # Add bars
        fig.add_trace(go.Bar(
            x=position_percentages.index,
            y=position_percentages.values,
            marker_color='#fa1428'  # Red color for the bars
        ))

        # Update layout
        fig.update_layout(
            title=f"Normalized Position Distribution for '{selected_song}'",
            xaxis_title="Normalized Position in Setlist",
            yaxis_title="Percentage of Performances",
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family="Barlow Condensed, sans-serif", size=14, color="white"),
            title_font=dict(family="Barlow Condensed, sans-serif", size=24, color="white"),
            xaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            yaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            height=600,
            margin=dict(l=50, r=20, t=80, b=50),
        )

        fig.update_xaxes(
            tickmode='linear',
            tick0=1,
            dtick=1,
            showgrid=True,
            gridcolor='rgba(255,255,255,0.1)'
        )

        fig.update_yaxes(
            showgrid=True,
            gridcolor='rgba(255,255,255,0.1)',
            ticksuffix='%'
        )

        return fig, selected_song  # Return the figure and maintain the selected song in the dropdown