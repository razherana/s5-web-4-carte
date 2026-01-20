<?php

use Illuminate\Support\Facades\Route;
use Kreait\Laravel\Firebase\Facades\Firebase;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/testSignin', function () {
    $auth = Firebase::auth();
    $signInResult = $auth->signInWithEmailAndPassword('razherana@gmail.com', 'herana');

    dd($signInResult);
});

Route::get('/testCreateUser', function () {
    $auth = Firebase::auth();
    $userProperties = [
        'email' => 'razherana@gmail.com',
        'password' => 'herana',
    ];
    $createdUser = $auth->createUser($userProperties);
    
    dd($createdUser);
});
