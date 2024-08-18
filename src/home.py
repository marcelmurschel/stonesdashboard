# home.py
from dash import html, dcc, Input, Output
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.express as px

# Load the data
df = pd.read_csv('2024_rollingstones_tourdata.csv')
df['date'] = pd.to_datetime(df['date'])
df['year'] = df['date'].dt.year

min_year = df['year'].min()
max_year = df['year'].max()

# Home layout
home_layout = html.Div([
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
            
            html.H2("(I Can't Get No) Satisfaction? Find It Here!",
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
                    html.Label("Select Timeframe", style={'color': 'white', 'fontSize': '1.2rem', 'marginBottom': '10px', 'fontWeight': 'bold'}),
                    dcc.RangeSlider(
                        id='year-range',
                        min=min_year,
                        max=max_year,
                        step=1,
                        marks={i: str(i) for i in range(min_year, max_year+1, 5)},
                        value=[min_year, max_year],
                    ),
                ], width=3),
                dbc.Col([
                    html.Label("Select Tour", style={'color': 'white', 'fontSize': '1.2rem', 'marginBottom': '10px', 'fontWeight': 'bold'}),
                    dcc.Dropdown(
                        id='tour-dropdown',
                        options=[{'label': tour, 'value': tour} for tour in df['tour_name'].dropna().unique()],
                        multi=True,
                        style={'backgroundColor': '#303030', 'color': 'black'}
                    ),
                ], width=3),
                dbc.Col([
                    html.Label("Select Country", style={'color': 'white', 'fontSize': '1.2rem', 'marginBottom': '10px', 'fontWeight': 'bold'}),
                    dcc.Dropdown(
                        id='country-dropdown',
                        options=[{'label': country, 'value': country} for country in df['country'].dropna().unique()],
                        multi=True,
                        style={'backgroundColor': '#303030', 'color': 'black'}
                    ),
                ], width=3),
                dbc.Col([
                    html.Label("Venue Capacity Range", style={'color': 'white', 'fontSize': '1.2rem', 'marginBottom': '10px', 'fontWeight': 'bold'}),
                    dcc.RangeSlider(
                        id='capacity-range',
                        min=10,
                        max=80000,
                        step=1000,
                        marks={i: f'{i:,}' for i in range(0, 80001, 20000)},
                        value=[10, 80000],
                    ),
                ], width=3),
            ], className="mb-4"),
            
            # Charts row
            dbc.Row([
                # Most Played Songs chart
                dbc.Col([
                    html.H3("Most Played Songs", 
                            style={
                                'fontFamily': 'Barlow Condensed, sans-serif',
                                'fontWeight': 'bold',
                                'color': 'white',
                                'textAlign': 'left',
                                'fontSize': '2rem',
                                'marginTop': '30px',
                                'marginBottom': '20px',
                                'paddingLeft': '20px',
                            }),
                    dcc.Graph(id='most-played-songs-chart')
                ], width=6),
                
                # Most Visited Cities chart
                dbc.Col([
                    html.H3("Most Visited Cities", 
                            style={
                                'fontFamily': 'Barlow Condensed, sans-serif',
                                'fontWeight': 'bold',
                                'color': 'white',
                                'textAlign': 'left',
                                'fontSize': '2rem',
                                'marginTop': '30px',
                                'marginBottom': '20px',
                                'paddingLeft': '20px',
                            }),
                    dcc.Graph(id='most-visited-cities-chart')
                ], width=6)
            ], justify="center"),
            
            # New row for the venue capacity scatter plot
            dbc.Row([
                dbc.Col([
                    html.H3("Venue Capacity Over Time", 
                            style={
                                'fontFamily': 'Barlow Condensed, sans-serif',
                                'fontWeight': 'bold',
                                'color': 'white',
                                'textAlign': 'left',
                                'fontSize': '2rem',
                                'marginTop': '30px',
                                'marginBottom': '20px',
                                'paddingLeft': '20px',
                            }),
                    dcc.Graph(id='venue-capacity-scatter')
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

def register_home_callbacks(app):
    @app.callback(
        [Output('most-played-songs-chart', 'figure'),
         Output('most-visited-cities-chart', 'figure'),
         Output('venue-capacity-scatter', 'figure')],
        [Input('year-range', 'value'),
         Input('tour-dropdown', 'value'),
         Input('country-dropdown', 'value'),
         Input('capacity-range', 'value')]
    )
    def update_charts(year_range, selected_tours, selected_countries, capacity_range):
        # Filter the dataframe based on selections
        filtered_df = df[
            (df['year'] >= year_range[0]) & 
            (df['year'] <= year_range[1]) &
            (df['venue_capacity'] >= capacity_range[0]) & 
            (df['venue_capacity'] <= capacity_range[1])
        ]
        
        if selected_tours:
            filtered_df = filtered_df[filtered_df['tour_name'].isin(selected_tours)]
        
        if selected_countries:
            filtered_df = filtered_df[filtered_df['country'].isin(selected_countries)]
        
        # Most Played Songs chart
        song_counts = []
        for setlist in filtered_df['setlist'].dropna():
            songs = eval(setlist)
            song_counts.extend(songs)
        
        song_df = pd.DataFrame({'song': song_counts})
        song_counts = song_df['song'].value_counts().reset_index()
        song_counts.columns = ['Song', 'Count']
        
        songs_fig = px.bar(
            song_counts.head(10),
            y='Song',
            x='Count',
            labels={'Count': 'Number of Performances'},
            color='Count',
            color_continuous_scale=['#f4b308', '#fa1428'],  # Yellow to Red
            orientation='h'
        )
        
        songs_fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family="Barlow Condensed, sans-serif", size=14, color="white"),
            xaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            yaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            height=500,
            margin=dict(l=20, r=20, t=20, b=20),
            yaxis={'categoryorder':'total ascending'},
            showlegend=False
        )
        
        # Most Visited Cities chart
        city_counts = filtered_df['city'].value_counts().reset_index()
        city_counts.columns = ['City', 'Count']
        
        cities_fig = px.bar(
            city_counts.head(10),
            y='City',
            x='Count',
            labels={'Count': 'Number of Performances'},
            color='Count',
            color_continuous_scale=['#f4b308', '#fa1428'],  # Yellow to Red
            orientation='h'
        )
        
        cities_fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family="Barlow Condensed, sans-serif", size=14, color="white"),
            xaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            yaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            height=500,
            margin=dict(l=20, r=20, t=20, b=20),
            yaxis={'categoryorder':'total ascending'},
            showlegend=False
        )
        
        # Venue Capacity Scatter Plot
        capacity_fig = px.scatter(
            filtered_df,
            x='date',
            y='venue_capacity',
            labels={'date': 'Date', 'venue_capacity': 'Venue Capacity'},
            color='venue_capacity',
            color_continuous_scale=['#f4b308', '#fa1428'],  # Yellow to Red
            hover_data={
                'date': '|%B %d, %Y',
                'venue': True,
                'city': True,
                'country': True,
                'tour_name': True,
                'venue_capacity': ':,',
            },
            custom_data=['venue', 'city', 'country', 'tour_name']
        )

        capacity_fig.update_traces(
            marker=dict(size=8),
            hovertemplate="<br>".join([
                "<b>%{customdata[0]}</b>",
                "Date: %{x|%B %d, %Y}",
                "Capacity: %{y:,}",
                "City: %{customdata[1]}",
                "Country: %{customdata[2]}",
                "Tour: %{customdata[3]}",
                "<extra></extra>"
            ])
        )

        capacity_fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family="Barlow Condensed, sans-serif", size=14, color="white"),
            xaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            yaxis_title_font=dict(family="Barlow Condensed, sans-serif", size=16, color="white"),
            height=500,
            margin=dict(l=20, r=20, t=20, b=20),
            showlegend=False
        )

        capacity_fig.update_xaxes(
            tickformat='%Y',
            dtick='M12',
            showgrid=True,
            gridcolor='rgba(255,255,255,0.1)'
        )

        capacity_fig.update_yaxes(
            showgrid=True,
            gridcolor='rgba(255,255,255,0.1)'
        )
        
        return songs_fig, cities_fig, capacity_fig