import React from 'react'
import Form from 'next/form'
import SearchFormReset from './SearchFormReset';

const SearchForm = ({query}: {query?: string}) => {
    
    return (
        <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '20px',
            border: '2px solid red'
        }}>
            <div style={{
                width: '600px',
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid blue',
                borderRadius: '8px'
            }}>
                <Form action="/" scroll={false} style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <input
                        name="query"
                        defaultValue={query}
                        placeholder="Search Startups"
                        style={{
                            flex: 1,
                            padding: '12px',
                            border: '2px solid black',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />

                    <button type="submit" style={{
                        padding: '12px 24px',
                        backgroundColor: 'blue',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        SEARCH
                    </button>

                    {query && (
                        <button type="button" style={{
                            padding: '12px',
                            backgroundColor: 'red',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}>
                            X
                        </button>
                    )}
                </Form>
                
                <p style={{marginTop: '10px', color: 'green'}}>
                    Query: "{query || 'none'}"
                </p>
            </div>
        </div>
    )
}

export default SearchForm