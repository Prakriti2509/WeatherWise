<?php

$city = $_GET['city'];
$apiKey = "API_KEY";

$cacheFile = "cache/" . strtolower($city) . ".json";
$cacheTime = 600;

if(file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)){
    echo file_get_contents($cacheFile);
} else {
    $url = "https://api.openweathermap.org/data/2.5/weather?q=$city&appid=$apiKey&units=metric";
    $data = file_get_contents($url);
    file_put_contents($cacheFile, $data);
    echo $data;
}

?>
